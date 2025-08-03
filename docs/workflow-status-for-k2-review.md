
# 워크플로우 상태 검토 요청 (K2님 문의용)

현재 두 개의 배포 워크플로우 파일이 GitHub Actions에서 계속 실패하고 있습니다.
OIDC 인증 방식을 사용하고 있으며, 가장 마지막에 시도했던 해결책은 `action-hosting-deploy` 액션을 제거하고 Firebase CLI를 직접 호출하는 것이었습니다.

아래는 현재 설정된 두 워크플로우 파일의 전체 내용입니다. 검토를 부탁드립니다.

---

## 1. `.github/workflows/deploy.yml`

```yml
name: Deploy to Firebase App Hosting
on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/675534587038/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
          service_account: firebase-app-hosting-compute@careconnect-app.iam.gserviceaccount.com
      
      - name: Install dependencies and build
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Firebase App Hosting
        run: npx firebase-tools hosting:channel:deploy live --project=careconnect-app --json
```

---

## 2. `.github/workflows/firebase-hosting-main.yml`

```yml
name: Deploy to Firebase App Hosting
on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/675534587038/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
          service_account: firebase-app-hosting-compute@careconnect-app.iam.gserviceaccount.com

      - name: Install dependencies and build
        run: |
          npm ci
          npm run build

      - name: Deploy to Firebase App Hosting
        run: npx firebase-tools hosting:channel:deploy live --project=careconnect-app --json
```
