# 배포 설정 요약 (deploy.yml & .firebaserc)

이 문서는 현재 프로젝트의 배포 관련 설정을 하나의 파일로 정리한 것입니다.

---

## 1. GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)

이 파일은 `main` 브랜치에 코드가 푸시될 때마다 자동으로 Firebase App Hosting에 배포하는 역할을 합니다.

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
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Install & build
        run: |
          npm ci
          npm run build

      - name: Deploy to Firebase App Hosting
        run: npx firebase-tools hosting:channel:deploy live
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ""
```

---

## 2. Firebase 프로젝트 설정 (`.firebaserc`)

이 파일은 현재 디렉토리가 어떤 Firebase 프로젝트에 속해있는지를 지정하여, 배포 명령어에서 `--project` 플래그를 생략할 수 있도록 합니다.

```json
{
  "projects": {
    "default": "angels-touch-e1lwx"
  }
}
```
