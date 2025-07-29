'use client';
import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Caregiver } from '@/types/caregiver-types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CaregiverStatusSelect({ caregiver, onStatusChange }: { caregiver: Caregiver; onStatusChange: (updatedCaregiver: Caregiver) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (status: '가능' | '불가능') => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/caregivers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: caregiver.id, status: status }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || '상태 업데이트에 실패했습니다.');
        }
        onStatusChange(result.updatedCaregiver);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "오류",
          description: err.message,
        });
      }
    });
  };

  return (
    <Select
        defaultValue={caregiver.status}
        onValueChange={handleValueChange}
        disabled={isPending}
    >
        <SelectTrigger className="w-full">
            {isPending ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>변경 중..</span>
                </div>
            ) : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="가능">
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    가능
                </span>
            </SelectItem>
            <SelectItem value="불가능">
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    불가능
                </span>
            </SelectItem>
        </SelectContent>
    </Select>
  );
}
