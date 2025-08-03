# 워크플로우 상태 검토 요청 (K2님 문의용)

현재 두 개의 배포 워크플로우 파일이 GitHub Actions에서 계속 실패하고 있습니다.
가장 최근에 제안해주신 "단순 1줄" CLI 호출 방식으로 수정한 후의 상태입니다. 이 내용이 올바르게 수정되었는지 검토를 부탁드립니다.

---

## 1. `.github/workflows/deploy.yml`

```yml
name: Deploy to Firebase App Hosting
on:
  push:
    branches: [main]

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

      - name: Install & build
        run: |
          npm ci
          npm run build

      - name: Deploy to Firebase App Hosting
        run: npx firebase-tools@latest hosting:channel:deploy live --project=careconnect-app
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ""

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
        run: npx firebase-tools@latest hosting:channel:deploy live --project=careconnect-app
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ""
```
