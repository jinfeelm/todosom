# 실제 배포 가능급 수정 계획

## 현재 진단

현재 폴더에는 구현 문서와 원천 백서만 있고 앱 소스 코드는 없다. 따라서 "수정"의 1차 대상은 문서 기준을 출시 가능한 실행 계획으로 보강하는 것이고, 2차 대상은 이 기준에 맞춰 Expo 앱을 새로 구현하는 것이다.

기존 문서는 로컬 MVP의 핵심 루프는 잘 고정하고 있다. 강점은 투두 -> 결 -> 펫 반응 -> 진화 -> 기록의 방 흐름, 점수/진화 순수 로직 분리, SQLite local-first 방향, 사용자를 탓하지 않는 UX 원칙이다.

배포 가능급으로 가려면 부족한 부분은 다음이다.

- 실제 Expo 프로젝트, 빌드 설정, 테스트/CI, 릴리스 프로필이 아직 없다.
- 디자인 시스템이 백서 수준이라 토큰, 컴포넌트 규칙, 접근성 기준으로 내려와 있지 않다.
- 분석 이벤트는 정의되어 있지만 개인정보, 이벤트 스키마 버전, 장애 추적, 실험 운영 기준이 없다.
- Supabase 동기화, RevenueCat 결제, 푸시, 스토어 제출은 로드맵에만 있고 구체 사양이 없다.
- 앱스토어 제출에 필요한 개인정보 처리방침, 데이터 삭제, 리뷰 계정, 스크린샷, 연령 등급, 결제 정책 체크리스트가 없다.
- 아트 스펙은 방향이 좋지만 실제 제작량, placeholder와 최종 아트 교체 기준, 파일 검증 자동화가 없다.

## 배포급 목표 정의

배포 가능급은 단순히 EAS 빌드가 성공하는 상태가 아니다. 다음 조건을 만족해야 한다.

- 신규 사용자가 가입이나 설명 없이 5분 안에 첫 씨앗 생성, 완료, 솜몽 부화를 경험한다.
- 로컬 데이터가 앱 재시작, 업데이트, migration 후에도 유지된다.
- 점수, 진화, 새 여정 처리는 중복 이벤트 없이 transaction으로 보호된다.
- iOS TestFlight와 Google Play Internal Testing에 올릴 수 있는 production profile 빌드가 있다.
- 개인정보 처리방침과 데이터 수집 내역이 실제 코드와 일치한다.
- 무료 핵심 경험과 유료 확장 사이의 윤리 경계가 코드와 스토어 문구에서 모두 지켜진다.
- 최소한의 crash/error 관측, 핵심 퍼널 이벤트, QA 체크리스트가 릴리스마다 반복 가능하다.

## P0: 문서와 제품 기준 보강

1. `release-readiness-checklist.md`를 추가한다.
   - EAS build, store metadata, privacy, data safety, screenshots, review notes, versioning, rollback 기준을 포함한다.
   - iOS와 Android를 분리해 체크한다.

2. `design-system-spec.md`를 추가한다.
   - 색상 토큰, 타이포그래피, spacing, radius, elevation, 버튼/입력/카드/탭 상태를 정의한다.
   - 백서의 "깨끗한 생산성 55%, 말랑한 감성 30%, 게임성 15%"를 실제 UI 규칙으로 바꾼다.
   - 접근성 기준: Dynamic Type 대응, 색 대비, 터치 영역 44px 이상, screen reader label을 포함한다.

3. `privacy-analytics-spec.md`를 추가한다.
   - 이벤트명, 속성, 수집 목적, 저장 위치, 보존 기간, opt-out 여부를 표로 관리한다.
   - 로컬 debug 이벤트와 프로덕션 분석 이벤트를 분리한다.
   - 투두 제목 같은 민감 가능 텍스트는 분석 이벤트에 싣지 않는다는 규칙을 둔다.

4. `sync-auth-spec.md`를 추가한다.
   - 로컬 익명 user id와 Supabase user id 매핑 전략을 정의한다.
   - RLS policy, 충돌 해결, 오프라인 큐, 계정 삭제, 데이터 내보내기 기준을 정한다.
   - 베타 전까지는 동기화를 붙이지 않더라도 local schema가 remote schema로 자연스럽게 이동해야 한다.

5. `monetization-policy-spec.md`를 추가한다.
   - RevenueCat entitlement와 내부 item unlock을 분리한다.
   - 유료 상품이 진화 점수, 성장 속도, 새 여정 기본권에 영향을 주지 못하도록 금지 테스트를 만든다.
   - restore purchases, 환불 후 권한 회수, 스토어별 상품 id 정책을 정한다.

## P1: 앱 골격과 도메인 안정화

1. Expo Router TypeScript 프로젝트를 만든다.
   - `app/(tabs)/today`, `app/(tabs)/pet-room`, `app/(tabs)/archive`, `app/(tabs)/store`, `app/onboarding` 구조를 사용한다.
   - `src/domain`, `src/db`, `src/stores`, `src/components`, `src/theme`, `src/assets`를 문서와 맞춘다.

2. 테스트 가능한 도메인 레이어를 먼저 만든다.
   - `GyeolType`, `RewardType`, `LifeStage`, `TodoStatus`, `Difficulty`를 단일 출처로 둔다.
   - `scoreTodoCompletion`, `evaluateGrowthEvolution`, `hatchIfNeeded`, `archiveCurrentPetAndStartNew`, `selectDialogue`는 UI import 없이 동작해야 한다.

3. 시간과 날짜 처리를 추상화한다.
   - `Clock` 또는 `now()` provider를 둬 테스트에서 날짜를 고정한다.
   - 한국/미국 등 시간대 변경 시 "오늘" 경계가 깨지지 않게 `due_date`와 `occurred_at` 정책을 분리한다.

4. 단위 테스트를 필수로 둔다.
   - 점수: 핵심 씨앗 보너스, 즉시완료 snack, 일일 상한, 같은 카테고리 감쇠, recovery.
   - 진화: 기준 미달, 점수 기준 조기 진화, 7일 기준 진화, 동률 처리, 중복 진화 방지.
   - 생애: egg -> baby, baby -> growth, archive 후 current pet 제외.

## P2: 로컬 DB와 데이터 무결성

1. expo-sqlite schema와 migration 시스템을 구현한다.
   - `schema_migrations` 테이블을 별도로 두는 쪽을 권장한다.
   - 모든 migration은 idempotent하게 작성하고 테스트 DB에서 재실행 가능해야 한다.

2. repository transaction을 강제한다.
   - `completeTodo()`는 todo update, completion insert, score event insert, hatch, evolution check를 안전하게 묶는다.
   - `todo_completions(todo_id)` unique index로 중복 완료를 막는다.
   - 핵심 씨앗 3개 제한은 UI가 아니라 repository에서도 막는다.

3. SQL 입력 안전성을 정한다.
   - 사용자 입력이 들어가는 쿼리는 prepared statement 또는 parameter binding만 허용한다.
   - raw `execAsync`는 migration과 seed처럼 사용자 입력이 없는 곳으로 제한한다.

4. 데이터 복구 UX를 만든다.
   - migration 실패, DB open 실패, corrupted state에 대한 error screen과 retry path를 만든다.
   - 출시 전에는 최소한 JSON export 또는 내부 debug dump를 준비한다.

## P3: 실제 앱 화면 완성

1. 온보딩은 설명 화면이 아니라 첫 루프 실행 화면으로 만든다.
   - 첫 씨앗 입력, 첫 완료, egg -> baby 부화, 오늘 화면 진입이 하나의 흐름이어야 한다.
   - 카테고리 설정은 건너뛰고 기본 `오늘/focus`로 시작한다.

2. 오늘 화면은 생산성 도구답게 빠르게 만든다.
   - 입력 sheet는 제목을 가장 먼저 받고, 나머지는 기본값으로 완료 가능해야 한다.
   - 완료 반응은 즉시 보이고 DB 실패 시 rollback 또는 재시도 안내가 있어야 한다.
   - loading, empty, ready, error 상태를 모두 구현한다.

3. 펫방은 제품의 감정 중심으로 만든다.
   - 펫은 화면의 중심 시각 요소여야 하고, placeholder라도 흐릿하거나 작으면 안 된다.
   - 말 걸기, 오늘의 결 요약, 진화 modal을 연결한다.
   - 애니메이션이 없더라도 idle/happy/talk/evolve 상태 구분은 asset manifest로 열어둔다.

4. 기록과 새 여정은 삭제가 아니라 보관으로 느껴져야 한다.
   - 현재 여정, 이전 여정, 진화 기록 상세를 분리한다.
   - 새 여정은 성장기 이후 가능하게 하고 확인 문구는 백서 원칙을 따른다.

5. 상점은 placeholder로만 배포한다.
   - 실제 결제 버튼은 베타 전까지 숨긴다.
   - "핵심 진화와 기본 여정은 무료"라는 윤리 문구를 노출한다.

## P4: 아트와 콘텐츠 파이프라인

1. placeholder 아트와 최종 아트를 명확히 분리한다.
   - placeholder는 개발용 태그를 manifest에 둔다.
   - 출시 후보 빌드에서는 placeholder asset이 남아 있으면 QA fail 처리한다.

2. sprite manifest validator를 만든다.
   - `assetKey`, `displayName`, `baseSize`, `states`, `frameCount`, `fps`, `loop` 누락을 검사한다.
   - 이미지 파일 존재 여부와 frame dimension 일치 여부를 검사한다.

3. 대사 콘텐츠를 데이터화한다.
   - 대사 id, condition, gyeolType, minAffection, text, animationState를 JSON 또는 TS constant로 관리한다.
   - guilt copy 금지어 검사를 간단한 스냅샷 테스트로 둔다.

## P5: 분석, 오류 추적, 운영 준비

1. 이벤트 추적 레이어를 추상화한다.
   - 개발 중에는 console/debug log, 베타부터는 선택한 analytics SDK로 보낸다.
   - 이벤트 payload에는 todo title, category name처럼 사용자가 쓴 원문을 넣지 않는다.

2. crash/error 관측을 붙인다.
   - DB migration 실패, repository transaction 실패, asset load 실패, navigation error를 분류한다.
   - 출시 전 crash-free session 기준을 정한다.

3. 운영 문구와 푸시 원칙을 문서화한다.
   - 푸시는 "압박"이 아니라 "초대"의 톤이어야 한다.
   - 알림 권한 요청은 첫 실행이 아니라 핵심 루프를 한 번 경험한 뒤 제안한다.

## P6: 계정, 동기화, 결제는 베타 트랙으로 분리

1. Supabase는 베타 전 별도 브랜치에서 붙인다.
   - Auth, RLS, remote schema, sync queue, conflict policy를 한 번에 설계한다.
   - 모든 사용자 소유 테이블에 `user_id`가 있고 RLS가 활성화되어야 한다.

2. RevenueCat은 무료 핵심 루프가 안정된 뒤 붙인다.
   - 구매 가능 상품은 유년기 펫, 방 테마, 소품, 진화 연출로 제한한다.
   - 진화 속도, 진화 점수, 새 여정 기본권을 판매하지 않는다.
   - restore purchases와 entitlement reconciliation을 QA에 포함한다.

3. 계정 기능이 들어가면 삭제/내보내기 경로를 같이 만든다.
   - 앱 안에서 개인정보 처리방침 접근이 가능해야 한다.
   - 계정 삭제 시 remote 데이터와 로컬 캐시 처리 기준을 명확히 한다.

## P7: 릴리스와 스토어 제출 준비

1. EAS 설정을 만든다.
   - `development`, `preview`, `production` build profile을 분리한다.
   - app version, build number, runtime version, update channel 정책을 정한다.

2. CI를 만든다.
   - typecheck, lint, unit test, migration smoke test, asset manifest validation을 PR마다 실행한다.
   - main branch는 preview build 생성까지 자동화하는 것을 목표로 한다.

3. 스토어 제출 자료를 준비한다.
   - 앱 이름, subtitle, description, keywords, icon, screenshots, preview video 여부.
   - 개인정보 처리방침 URL, 지원 URL, 앱 접근 정보, 테스트 계정 또는 리뷰 가이드.
   - Google Play Data safety와 Apple privacy nutrition label을 실제 SDK 기준으로 작성한다.

4. 릴리스 승인 기준을 둔다.
   - 필수 QA 시나리오 전부 통과.
   - migration 재설치/업데이트 테스트 통과.
   - iOS/Android 실제 기기 각 2종 이상 smoke test 통과.
   - 주요 화면에서 텍스트 잘림, 하단 탭 겹침, 펫 흐림 현상 없음.
   - 결제 없는 MVP라면 결제 CTA와 외부 결제 유도 문구 없음.

## 추천 구현 순서

1. 문서 보강: release, design system, privacy/analytics, sync, monetization spec 추가.
2. Expo 앱 scaffold와 도메인 타입 생성.
3. 점수/진화/생애/대사 순수 로직과 단위 테스트 구현.
4. SQLite migration, seed, repository transaction 구현.
5. 온보딩 -> 오늘 -> 펫방 -> 기록 -> 상점 placeholder 순서로 화면 연결.
6. 아트 placeholder와 manifest validator 추가.
7. QA 시나리오 자동/수동 체크리스트로 첫 루프와 첫 진화 검증.
8. EAS preview build와 내부 테스트 준비.
9. Supabase/RevenueCat/푸시는 로컬 MVP가 안정된 뒤 베타 트랙에서 붙인다.

## 외부 공식 문서 확인 항목

출시 또는 베타 직전에는 다음 공식 문서를 최신 기준으로 다시 확인한다.

- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- RevenueCat React Native/Expo: https://www.revenuecat.com/docs/getting-started/installation/reactnative
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Payments Policy: https://support.google.com/googleplay/android-developer/answer/10281818

## 바로 다음 액션

가장 먼저 할 일은 `release-readiness-checklist.md`, `design-system-spec.md`, `privacy-analytics-spec.md` 3개 문서를 추가하는 것이다. 이 세 문서가 있어야 개발자가 "귀여운 MVP"가 아니라 "심사와 운영까지 통과할 앱"의 기준으로 구현할 수 있다.
