#!/usr/bin/env bash
# TodoSom — M1/M2/M3 Mac + iPhone(Expo Go) 개발 환경 원클릭 세팅
# 사용법: bash scripts/setup-macos.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info()  { printf '\033[36m▸ %s\033[0m\n' "$*"; }
ok()    { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[33m! %s\033[0m\n' "$*"; }
fail()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# 셸 프로필(~/.zprofile)에 PATH 한 줄 추가 (중복 방지)
ensure_profile_line() {
  local line="$1"
  local profile="${HOME}/.zprofile"
  touch "$profile"
  grep -Fq "$line" "$profile" 2>/dev/null || echo "$line" >> "$profile"
}

info "TodoSom Mac 개발 환경 세팅을 시작합니다."

# ── 1. Xcode Command Line Tools (git, 컴파일러) ─────────────────────────────
if ! xcode-select -p >/dev/null 2>&1; then
  info "Xcode Command Line Tools 설치 중… (팝업이 뜨면 '설치'를 눌러주세요)"
  xcode-select --install || true
  warn "CLT 설치가 끝날 때까지 기다린 뒤, 이 스크립트를 다시 실행하세요."
  exit 0
fi
ok "Xcode Command Line Tools"

# ── 2. Homebrew ───────────────────────────────────────────────────────────────
if ! command -v brew >/dev/null 2>&1; then
  info "Homebrew 설치 중…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon 기본 경로
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    ensure_profile_line 'eval "$(/opt/homebrew/bin/brew shellenv)"'
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
    ensure_profile_line 'eval "$(/usr/local/bin/brew shellenv)"'
  fi
fi
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null || true)"
command -v brew >/dev/null 2>&1 || fail "Homebrew 설치 후 터미널을 다시 열고 스크립트를 재실행하세요."
ok "Homebrew $(brew --version | head -1)"

# ── 3. Node.js 22 + watchman ──────────────────────────────────────────────────
NODE_PREFIX="$(brew --prefix node@22 2>/dev/null || true)"
if [[ -z "$NODE_PREFIX" ]] || [[ ! -d "$NODE_PREFIX/bin" ]]; then
  info "Node.js 22 설치 중…"
  brew install node@22
  NODE_PREFIX="$(brew --prefix node@22)"
fi

# node@22는 keg-only → zsh 새 터미널에서도 npm/node가 보이도록 PATH 영구 등록
ensure_profile_line "export PATH=\"${NODE_PREFIX}/bin:\$PATH\""
export PATH="${NODE_PREFIX}/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js PATH 등록 실패. 터미널을 새로 연 뒤: source ~/.zprofile"
fi
ok "Node $(node -v) · npm $(npm -v)"

if ! command -v watchman >/dev/null 2>&1; then
  info "watchman 설치 중… (Metro 번들러 성능 향상)"
  brew install watchman
fi
ok "watchman"

# ── 4. 의존성 설치 & 검증 ───────────────────────────────────────────────────
info "npm 패키지 설치 중…"
npm ci

info "타입체크 & 테스트 실행 중…"
npm run typecheck
npm test
npm run validate:assets

ok "프로젝트 검증 완료"

# ── 5. Expo SDK 버전 정합 ───────────────────────────────────────────────────
info "Expo SDK 패키지 버전 확인 중…"
npx expo install --fix --yes 2>/dev/null || npx expo install --fix || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ok "Mac 개발 환경 세팅 완료!"
echo ""
echo "  다음 단계 (아이폰 실기기 테스트):"
echo ""
echo "  1. App Store에서 'Expo Go' 설치"
echo "  2. Mac과 iPhone을 같은 Wi‑Fi에 연결"
echo "  3. npm을 못 찾으면: source ~/.zprofile"
echo "  4. 개발 서버 시작:"
echo ""
echo "       cd \"$ROOT\""
echo "       npm start"
echo ""
echo "  5. 터미널 QR 코드를 iPhone 카메라로 스캔 → Expo Go에서 열기"
echo ""
echo "  자세한 가이드: docs/setup-macos-iphone.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
