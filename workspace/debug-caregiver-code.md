
# 간병인 등록 기능 관련 코드 모음 (K2 문의용)

## 문제 상황 요약

Next.js 앱에서 서버 액션을 사용하여 간병인을 등록하는 기능 구현 중, "간병인 추가" 버튼 클릭 시 클라이언트에 "서버 응답이 올바르지 않습니다. 다시 시도해주세요"라는 오류가 지속적으로 발생하고 있습니다.

이 오류는 클라이언트가 서버 액션으로부터 `undefined`를 반환받았을 때 표시되도록 설정되어 있으며, 이는 서버 액션이 정상적으로 값을 `return`하지 못하고 중간에 실행이 종료됨을 의미합니다.

### 현재까지 시도된 실패한 해결책들

1.  **DB 라이브러리 교체:** `better-sqlite3`에서 `sqlite3`로 변경했으나 실패했습니다.
2.  **DB 파일 경로 변경:** 파일 경로를 `/tmp`로 지정했으나 실패했습니다.
3.  **`revalidatePath()` 제거:** 캐시 무효화 함수를 제거했으나 실패했습니다.
4.  **DB 로직 완전 제거:** DB 로직을 모두 제거하고 단순 객체만 반환하도록 수정했으나 실패했습니다.
5.  **`sqlite3` 완전 제거 및 순수 배열 사용 (현재 코드 상태):** 파일 시스템 및 DB 라이브러리 의존성을 완전히 제거하기 위해, `src/lib/caregivers.ts`를 순수 인메모리 배열로만 동작하도록 수정했습니다. **하지만 이 방법조차 동일하게 실패했습니다.**

현재 코드는 가장 단순화된, 외부 의존성이 거의 없는 상태임에도 불구하고 서버 액션이 값을 반환하지 못하고 있습니다. 문제의 원인이 코드 로직보다는, 이 개발 환경과 Next.js 서버 액션 실행 모델 간의 근본적인 호환성 문제일 것으로 강력하게 의심됩니다.

---

### 1. 클라이언트 UI 컴포넌트 (`src/app/admin/page.tsx`)

```tsx
'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { getCaregivers } from '@/lib/caregivers';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LogoutButton from '@/components/admin/logout-button';
import { addCaregiverAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import CaregiverStatusSelect from '@/components/admin/caregiver-status-select';


// CaregiverForm component handles adding new caregivers.
function CaregiverForm({ onSuccess }: { onSuccess: (newCaregiver: Caregiver) => void }) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    // The server action is called directly. Its return value is handled below.
    const result = await addCaregiverAction(formData);

    setIsSubmitting(false);

    // The result object is now guaranteed to be defined.
    // We check its 'success' property to determine the outcome.
    if (result?.success && result.newCaregiver) {
      toast({
        title: '성공',
        description: `'${result.newCaregiver.name}' 님이 성공적으로 등록되었습니다.`,
      });
      formRef.current?.reset();
      onSuccess(result.newCaregiver);
    } else {
      // Use the specific error message from the server, or a fallback.
      const errorMessage = result?.error || '서버 응답이 올바르지 않습니다. 다시 시도해주세요.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <Card>
        <CardHeader>
          <CardTitle>새 간병인 등록</CardTitle>
          <CardDescription>새로운 간병인의 이름을 입력하여 시스템에 추가합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름<span className="text-destructive">*</span></Label>
            <Input id="name" name="name" required placeholder="홍길동" disabled={isSubmitting} />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '간병인 추가'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}


function CaregiverTable({ caregivers }: { caregivers: Caregiver[] }) {
  if (!caregivers || caregivers.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">등록된 간병인이 없습니다.</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>이름</TableHead>
            <TableHead className="w-[150px] text-center">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caregivers.map((caregiver) => (
            <TableRow key={caregiver.id}>
              <TableCell className="font-mono text-xs">{caregiver.id}</TableCell>
              <TableCell className="font-medium">{caregiver.name}</TableCell>
              <TableCell>
                <CaregiverStatusSelect caregiver={caregiver} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Main AdminPage Component
export default function AdminPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSuccess = (newCaregiver: Caregiver) => {
    // Add the new caregiver to the top of the list and re-sort by ID.
    setCaregivers((prev) => [newCaregiver, ...prev].sort((a,b) => (b.id || 0) - (a.id || 0)));
  };

  useEffect(() => {
    const loadCaregivers = async () => {
      try {
        setIsLoading(true);
        const data = await getCaregivers();
        // Sort data by ID in descending order.
        const sortedData = (data || []).sort((a, b) => (b.id || 0) - (a.id || 0));
        setCaregivers(sortedData);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: error.message || '간병인 목록을 불러오지 못했습니다.',
        });
        setCaregivers([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCaregivers();
  }, [toast]);

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">관리자 페이지</h1>
          <p className="text-muted-foreground mt-2">간병인 정보를 등록하고 관리합니다.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <CaregiverForm onSuccess={handleSuccess} />
        <Card>
          <CardHeader>
            <CardTitle>등록된 간병인 목록</CardTitle>
            <CardDescription>{caregivers.length}명의 간병인이 등록되어 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CaregiverTable caregivers={caregivers} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### 2. 서버 액션 파일 (`src/app/admin/actions.ts`)

```ts
'use server';

import { z } from 'zod';
import type { Caregiver } from '@/types/caregiver-types';
import { revalidatePath } from 'next/cache';
import { addCaregiverToDb, updateCaregiverStatusInDb } from '@/lib/caregivers';

const CaregiverSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다."),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  newCaregiver?: Caregiver;
};

// K2's simplified action for testing
export async function addCaregiverAction(formData: FormData): Promise<ActionResponse> {
  const nameValue = formData.get('name');
  
  // This is the version proposed by Grok, ensuring a return value in all paths.
  if (!nameValue || typeof nameValue !== 'string' || !nameValue.trim()) {
    return { success: false, error: '이름을 입력해주세요.' };
  }
  
  try {
    // This now calls the fake in-memory function from caregivers.ts
    const newCaregiver = await addCaregiverToDb({ name: nameValue });
    
    revalidatePath('/admin');
    return { success: true, newCaregiver };

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 서버 오류가 발생했습니다.';
    return { success: false, error: errorMessage };
  }
}


const updateCaregiverStatusSchema = z.object({
    caregiverId: z.coerce.number(),
    status: z.enum(['가능', '불가능']),
});

export async function updateCaregiverStatusAction(formData: FormData): Promise<ActionResponse> {
    const validatedFields = updateCaregiverStatusSchema.safeParse({
        caregiverId: formData.get('caregiverId'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const errorMessage = error.caregiverId?.[0] || error.status?.[0] || '잘못된 데이터입니다.';
        return { success: false, error: errorMessage };
    }
    
    const { caregiverId, status } = validatedFields.data;

    try {
        await updateCaregiverStatusInDb(caregiverId, status);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : '상태 업데이트 중 서버 오류가 발생했습니다.';
        return { success: false, error: errorMessage };
    }
}
```

---

### 3. **가상** 데이터베이스 모듈 (`src/lib/caregivers.ts`) - 현재 상태

```ts
'use server';

import type { Caregiver } from '@/types/caregiver-types';
import { unstable_noStore as noStore } from 'next/cache';

// K2's suggestion: Use a simple in-memory array to simulate the database
// This completely removes the sqlite3 dependency for this test.
let caregivers_db: Caregiver[] = [];
let sequence = 1;

/**
 * [TEST] Fetches caregivers from the in-memory array.
 * @returns {Promise<Caregiver[]>} A list of caregivers.
 */
export async function getCaregivers(): Promise<Caregiver[]> {
  noStore();
  console.log('[Test DB] getCaregivers called. Returning:', caregivers_db);
  // Return a copy, sorted by ID descending
  return [...caregivers_db].sort((a, b) => b.id - a.id);
}

/**
 * [TEST] Adds a new caregiver to the in-memory array.
 * @param {object} caregiverData - The data for the new caregiver.
 * @param {string} caregiverData.name - The name of the caregiver.
 * @returns {Promise<Caregiver>} The newly created caregiver object.
 */
export async function addCaregiverToDb({ name }: { name: string }): Promise<Caregiver> {
  console.log('[Test DB] addCaregiverToDb called with name:', name);
  
  // Simulate unique constraint
  if (caregivers_db.some(c => c.name === name)) {
    throw new Error('이미 존재하는 간병인 이름입니다.');
  }

  const newCaregiver: Caregiver = {
    id: sequence++,
    name: name,
    status: '가능',
  };
  
  caregivers_db.push(newCaregiver);
  console.log('[Test DB] New caregiver added:', newCaregiver);
  
  return newCaregiver;
}

/**
 * [TEST] Updates the status of a caregiver in the in-memory array.
 * @param {number} id - The ID of the caregiver to update.
 * @param {'가능' | '불가능'} status - The new status.
 * @returns {Promise<void>}
 */
export async function updateCaregiverStatusInDb(id: number, status: '가능' | '불가능'): Promise<void> {
    console.log('[Test DB] updateCaregiverStatusInDb called for id:', id);
    const caregiver = caregivers_db.find(c => c.id === id);
    if (caregiver) {
        caregiver.status = status;
        console.log('[Test DB] Status updated for:', caregiver);
    } else {
        throw new Error('해당 ID의 간병인을 찾을 수 없습니다.');
    }
}
```

---

### 4. 관련 타입 정의 (`src/types/caregiver-types.ts`)

```ts
// This file now only contains pure type definitions.
export interface Caregiver {
  id: number;
  name: string;
  birthDate?: string;
  gender?: '남성' | '여성';
  experience?: string;
  certifications?: string;
  unavailableDates?: string[];
  status: '가능' | '불가능';
}

export interface CaregiverRecommendationInput {
  patientGender?: '남성' | '여성';
  patientBirthDate?: string;
  careType: string;
  requestedDates?: string[];
  requestedTime?: string;
  specificNeeds: string;
}

export interface CaregiverRecommendationOutput {
  recommendations: {
    name: string;
    age: number;
    gender: string;
    experience: string;
    certifications: string[];
    suitabilityScore: number;
  }[];
}
```

---

### 5. `package.json` 의존성

`better-sqlite3`와 `sqlite3`를 모두 제거한 상태입니다.

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.400.0",
    "next": "15.3.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```
