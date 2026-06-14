# GitHub · Slack 연동 가이드

로컬 `node_modules` 없이 GitHub에서 코드를 보관하고, push/CI 결과를 Slack `#todosom-전체`에 받는 방법입니다.

레포: https://github.com/jinfeelm/todosom

## 1. GitHub에 코드 올리기 (완료)

```powershell
cd C:\Users\rkdud\OneDrive\Desktop\todosom
git remote add origin https://github.com/jinfeelm/todosom.git
git push -u origin main
```

## 2. 로컬 용량 줄이기

GitHub에 push한 뒤 로컬에서 `node_modules`만 지워도 됩니다 (`.gitignore`에 포함됨).

```powershell
Remove-Item -Recurse -Force node_modules
git clone https://github.com/jinfeelm/todosom.git
cd todosom
npm ci
```

또는 **GitHub Codespaces**에서 `.devcontainer` 설정으로 브라우저/클라우드에서 바로 작업할 수 있습니다.

## 3. Slack CI 알림 (최초 1회)

1. https://todosom.slack.com/apps/A0F7XDUAZ-incoming-webhooks 에서 **Incoming Webhooks** 추가
2. `#todosom-전체` 채널용 Webhook URL 생성
3. 아래 스크립트로 GitHub Secret 등록:

```powershell
.\scripts\setup-slack-webhook.ps1
```

또는 GitHub 레포 → **Settings → Secrets and variables → Actions** → `SLACK_WEBHOOK_URL` 수동 추가

이후 `main`에 push하거나 PR을 열면 CI(typecheck, test, asset 검증) 결과가 Slack에 정리되어 옵니다.

## 4. GitHub ↔ Slack 구독 (선택)

Slack `#todosom-전체`에서 GitHub 앱 설치 후:

```
/github subscribe jinfeelm/todosom commits pulls issues workflows
```

push·PR·이슈·워크플로우 알림을 채널에 추가로 받을 수 있습니다.
