# MacBook (M1) + iPhone 개발 환경 세팅

M1/M2/M3 맥북에서 코드를 수정하고, **아이폰(Expo Go)** 으로 TodoSom을 직접 테스트하는 방법입니다.

> Xcode 전체 설치는 **필요 없습니다.** Expo Go만 있으면 Phase 0 프로토타입을 실기기에서 바로 확인할 수 있습니다.

레포: https://github.com/jinfeelm/todosom

---

## 한 줄 요약

터미널을 열고 아래를 **순서대로** 실행하세요.

```bash
# 1) 레포 clone
git clone https://github.com/jinfeelm/todosom.git
cd todosom

# 2) Mac 세팅 (Homebrew, Node, npm ci, 테스트까지 자동)
bash scripts/setup-macos.sh

# 3) 개발 서버 시작
npm start
```

iPhone **Expo Go** 앱으로 QR 코드를 스캔하면 앱이 열립니다.

---

## 사전 준비 (5분)

| 항목 | 설명 |
|------|------|
| **Mac** | M1 MacBook Air 등 Apple Silicon |
| **iPhone** | iOS 15+ 권장 |
| **Expo Go** | [App Store](https://apps.apple.com/app/expo-go/id982107779) 에서 무료 설치 |
| **Wi‑Fi** | Mac과 iPhone이 **같은 네트워크**에 있어야 함 |
| **Cursor** | (선택) Desktop 앱 설치 후 `todosom` 폴더 열기 |

---

## 1. Cursor Desktop 설치 (선택, AI와 함께 개발)

1. https://cursor.com 에서 Mac용 Cursor 다운로드
2. 설치 후 **File → Open Folder** → `todosom` 폴더 선택
3. 채팅/Agent로 기능 요청 → 코드 수정 → `npm start`로 바로 확인

Cloud Agent가 PR을 올리면 Mac에서:

```bash
cd todosom
git pull
npm ci   # package.json 변경 시에만
npm start
```

---

## 2. 자동 세팅 스크립트가 하는 일

`bash scripts/setup-macos.sh` 는 다음을 자동으로 처리합니다.

1. **Xcode Command Line Tools** — git, 기본 빌드 도구 (Xcode 앱 전체 X)
2. **Homebrew** — Mac 패키지 관리자
3. **Node.js 22** — devcontainer/CI와 동일 버전
4. **watchman** — Metro(번들러) 파일 감시 성능 개선
5. **`npm ci`** — 의존성 설치
6. **typecheck · test · asset 검증** — 프로젝트가 정상인지 확인
7. **Expo SDK 버전 정합** — `expo install --fix`

스크립트 중간에 CLT 설치 팝업이 뜨면 **설치**를 누르고, 완료 후 **같은 명령을 다시** 실행하세요.

---

## 3. 아이폰에서 앱 실행

```bash
cd todosom
npm start
```

터미널에 QR 코드가 표시됩니다.

1. iPhone **카메라**로 QR 스캔
2. 상단 배너 탭 → **Expo Go**에서 열기
3. 앱 로딩 후 온보딩 화면 확인

### 자주 쓰는 단축키 (Metro 터미널)

| 키 | 동작 |
|----|------|
| `r` | 앱 리로드 |
| `m` | 개발 메뉴 |
| `j` | 디버거 열기 |

---

## 4. 문제 해결

### QR 스캔 후 연결 안 됨

- Mac과 iPhone이 **같은 Wi‑Fi**인지 확인
- 회사/학교 Wi‑Fi는 기기 간 통신을 막는 경우가 많음 → **iPhone 핫스팟**에 Mac 연결 후 재시도
- 터널 모드: `npx expo start --tunnel` (느리지만 방화벽 우회에 유용)

### `ExpoSQLite` / DB 오류

```bash
npm ci
npm start   # dev 서버 완전히 재시작 (Ctrl+C 후)
```

### Expo SDK 버전 불일치

```bash
npx expo install --fix
npm start
```

### `zsh: command not found: npm` (가장 흔함)

Homebrew `node@22`는 PATH에 자동으로 안 잡히는 경우가 있습니다. 아래 **한 줄** 실행 후 다시 시도:

```bash
source ~/.zprofile
npm -v
```

`npm` 버전이 나오면:

```bash
cd ~/todosom
npm start
```

여전히 안 되면 PATH를 직접 등록:

```bash
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
npm -v
```

### `npm ci` 실패

```bash
node -v    # v20 이상이어야 함
bash scripts/setup-macos.sh   # Node 재설치 포함
source ~/.zprofile
```

### Mac에서 웹으로만 먼저 보고 싶을 때

```bash
npm run web
```

브라우저에서 UI 미리보기 가능. 단, **실제 Phase 0 목표는 iOS 실기기**이며 웹은 sql.js 기반 preview입니다.

---

## 5. 일상 개발 루틴

```bash
cd todosom
git pull                  # 최신 코드
npm ci                    # package-lock 변경 시
npm test                  # 도메인 로직 확인
npm start                 # 아이폰 테스트
```

코드 수정 후 iPhone에서 **흔들기(Shake)** → Reload, 또는 Metro에서 `r`.

---

## 6. iOS 네이티브 빌드가 필요해지면 (Phase 0 이후)

Expo Go로는 커스텀 네이티브 모듈을 쓸 수 없습니다. 스토어 배포·푸시 등 네이티브 빌드가 필요하면:

- **Xcode** (App Store, ~12GB+) 설치
- `npx expo run:ios` 또는 EAS Build

Phase 0 프로토타입 범위에서는 **Expo Go만으로 충분**합니다.

---

## 관련 문서

- 프로젝트 개요: [README.md](../README.md)
- GitHub · Slack CI: [setup-github-slack.md](./setup-github-slack.md)
- 구현 스펙: [implementation/00-index.md](./implementation/00-index.md)
