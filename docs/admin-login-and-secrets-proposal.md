# 관리자 로그인 및 보안 비밀 관리 최종 제안 (K2 검토용)

이 문서는 로컬 개발과 실제 배포 환경을 모두 고려한 관리자 로그인 및 보안 비밀(API 키, 이메일 등) 관리 기능 구현에 필요한 모든 코드 변경 사항과 중요 고려사항을 하나의 파일로 정리한 것입니다.

**핵심 아키텍처:**
- **로컬 개발 환경:** `.env.local` 파일을 사용하여 모든 민감 정보를 관리합니다. 이를 통해 개발자는 실제 배포에 영향을 주지 않고 모든 기능을 자유롭게 테스트할 수 있습니다.
- **배포 환경:** `apphosting.yaml` 파일을 통해 Firebase **Secret Manager**를 사용합니다. 코드나 설정 파일에 실제 비밀번호나 API 키를 저장하지 않아 보안이 크게 강화됩니다.

---

## 1. 신규/수정 파일 목록

### 1.1 `apphosting.yaml` (수정)

배포 환경에서 사용할 모든 민감 정보를 **Firebase Secret Manager**를 통해 참조하도록 설정합니다. `value` 대신 `secret` 키를 사용하여, 실제 값은 코드 저장소(GitHub)에 노출되지 않고 Firebase에 안전하게 보관됩니다.

```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1

env:
  - variable: CARECONNECT_ADMIN_USERNAME
    secret: CARECONNECT_ADMIN_USERNAME
    availability:
      - RUNTIME

  - variable: CARECONNECT_ADMIN_PASSWORD
    secret: CARECONNECT_ADMIN_PASSWORD
    availability:
      - RUNTIME

  - variable: CARECONNECT_RESEND_API_KEY
    secret: CARECONNECT_RESEND_API_KEY
    availability:
      - RUNTIME

  - variable: CARECONNECT_EMAIL_FROM
    secret: CARECONNECT_EMAIL_FROM
    availability:
      - RUNTIME

  - variable: CARECONNECT_ADMIN_EMAIL_1
    secret: CARECONNECT_ADMIN_EMAIL_1
    availability:
      - RUNTIME
```

---

### 1.2 `.gitignore` (신규)

민감 정보(`.env*`), 로컬 데이터베이스(`careconnect.db`), 불필요한 폴더(`node_modules`, `.next` 등)가 Git에 의해 추적되거나 GitHub에 업로드되는 것을 방지합니다.

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# local database file
careconnect.db*
```

---

### 1.3 `.env.example` (신규)

이 프로젝트를 실행하는 데 어떤 환경 변수가 필요한지 알려주는 예제 파일입니다. 실제 비밀 값은 비워두어 GitHub에 안전하게 공유할 수 있습니다.

```
# 로컬 개발용 관리자 계정 (예시)
CARECONNECT_ADMIN_USERNAME=admin
CARECONNECT_ADMIN_PASSWORD=password

# 로컬 개발용 Resend 이메일 설정 (예시)
CARECONNECT_RESEND_API_KEY=
CARECONNECT_EMAIL_FROM=
CARECONNECT_ADMIN_EMAIL_1=
```

---

### 1.4 `.env.local` (기존 파일 유지)

로컬 개발 환경에서만 사용하는 파일입니다. `.gitignore`에 의해 Git 추적에서 제외되므로 민감 정보를 안전하게 저장하고 테스트할 수 있습니다.

```
CARECONNECT_ADMIN_USERNAME=admin
CARECONNECT_ADMIN_PASSWORD=password
CARECONNECT_RESEND_API_KEY=re_12345678_abcdefgh
CARECONNECT_EMAIL_FROM=test@example.com
CARECONNECT_ADMIN_EMAIL_1=mytestemail@example.com
```

---

## 2. 관련 핵심 코드 (참고)

### 2.1 `src/app/login/actions.ts`

로그인 로직은 `process.env`를 통해 환경 변수를 읽습니다. 이는 로컬 환경에서는 `.env.local`의 값을, 배포 환경에서는 `apphosting.yaml`에 연결된 Secret Manager의 값을 자동으로 사용하게 만듭니다.

```ts
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function login(prevState: any, formData: FormData) {
  try {
    const parsed = schema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errorMessage = fieldErrors.username?.[0] || fieldErrors.password?.[0] || '아이디와 비밀번호를 모두 입력해주세요.';
        return { error: errorMessage };
    }

    const { username, password } = parsed.data;
    
    // 로컬에서는 .env.local, 배포 환경에서는 Secret Manager의 값을 읽어옵니다.
    const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME;
    const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials are not set in the environment variables.');
      return { error: '서버에 관리자 정보가 설정되지 않았습니다. 관리자에게 문의하세요.' };
    }

    if (username !== adminUsername || password !== adminPassword) {
      // Add a server-side log for easier debugging on the server.
      console.log(`Login attempt failed for user: ${username}. Credentials match: ${username === adminUsername}`);
      return { error: '아이디 또는 비밀번호가 잘못되었습니다.' };
    }
    
    cookies().set({
        name: 'session',
        value: 'admin-logged-in',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

  } catch (error) {
    console.error('Login action failed:', error);
    return { error: '로그인 중 알 수 없는 오류가 발생했습니다.' };
  }
  
  // 로그인 성공 시 /admin 페이지로 리디렉션
  redirect('/admin');
}

export async function logout() {
  try {
    cookies().delete('session');
  } catch(error) {
     console.error('Logout failed:', error);
  }
  redirect('/login');
}
```
---

## 3. 중요 고려사항 (잠재적 오류)

### 3.1 Secret 이름 불일치

- **내용:** `apphosting.yaml`에 정의된 `secret: CARECONNECT_ADMIN_PASSWORD` 값은 Firebase Secret Manager에 생성하는 Secret의 **이름(ID)**과 반드시 **정확히 일치**해야 합니다.
- **오류 발생 시:** 이름이 다르면 앱은 해당 환경 변수를 `undefined`로 인식하여 로그인 실패, 이메일 발송 실패 등 런타임 오류를 일으킵니다.
- **조치:** Firebase 콘솔에서 Secret 생성 시, `apphosting.yaml`에 정의된 이름을 그대로 복사하여 사용해야 합니다.

### 3.2 `.env` 파일의 Git 추적 위험

- **내용:** `.gitignore` 파일이 없으면 민감 정보가 담긴 `.env.local` 파일이 GitHub에 업로드될 수 있습니다.
- **조치:** 이번 변경에 **`.gitignore` 파일을 추가**하여 이 위험을 원천적으로 차단했습니다. `.env.example` 파일을 통해 팀원들에게 필요한 환경 변수 목록을 안전하게 공유할 수 있습니다.
