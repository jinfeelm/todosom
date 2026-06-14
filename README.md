# TodoSom (투두솜)

할 일을 완료하면 **결**이 쌓이고, 솜뭉치 펫 **솜몽**이 자라는 local-first 펫 투두 앱 Phase 0 프로토타입입니다.

## 실행 방법

```powershell
cd C:\Users\rkdud\OneDrive\Desktop\todosom
npm install
npm run typecheck
npm test
npx expo start
```

Expo SDK 패키지 버전이 맞지 않으면:

```powershell
npx expo install --fix
```

## 스택

- React Native + Expo 54
- TypeScript, Expo Router
- expo-sqlite, Zustand
- Vitest (도메인 단위 테스트)

## Phase 0 범위

- 온보딩 → 첫 씨앗 완료 → 솜몽 부화
- 오늘 화면 (투두, 핵심 씨앗 1~3개)
- 펫방 (말 걸기, 진화)
- 기록의 방 (새 여정)
- 상점 placeholder (결제 없음)

## 프로젝트 구조

```text
src/
  app/           Expo Router 화면
  domain/        점수·진화·대사 순수 로직
  db/            SQLite schema, migration, repository
  stores/        Zustand + DB context
  components/    UI 컴포넌트
  assets/        펫/방 manifest (placeholder)
```

## 플랫폼 안내

| 플랫폼 | DB | 비고 |
|--------|-----|------|
| iOS / Android | `expo-sqlite` | 실제 앱 (Phase 0 목표) |
| Web | `sql.js` + localStorage | UI 미리보기용 (데이터는 브라우저에 저장) |

웹에서 `ExpoSQLite` 오류가 났다면 `npm install` 후 dev 서버를 **재시작**하세요.

```powershell
npx expo start --web
```

```powershell
npm test
npm run validate:assets
```

## GitHub에서 작업하기

코드는 GitHub `todosom` 레포에 보관합니다. `node_modules`는 Git에 포함되지 않으므로 clone 후 `npm ci`만 실행하면 됩니다.

- **클라우드 IDE**: GitHub Codespaces (`.devcontainer` 포함)
- **CI**: push/PR 시 typecheck · test · asset 검증 (`.github/workflows/ci.yml`)
- **Slack 알림**: CI 결과 → `#todosom-전체` (설정: `docs/setup-github-slack.md`)

```powershell
gh auth login
git clone https://github.com/<계정>/todosom.git
cd todosom
npm ci
npm test
```

## 문서

구현 기준은 `docs/implementation/` 폴더의 13개 문서를 따릅니다.

- GitHub · Slack 연동: `docs/setup-github-slack.md`
