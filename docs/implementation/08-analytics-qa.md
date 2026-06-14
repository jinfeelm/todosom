# 분석 이벤트와 QA 기준

## 분석 방향

MVP 분석의 목적은 많은 지표를 모으는 것이 아니라 핵심 루프가 어디서 끊기는지 확인하는 것이다.

```text
앱 실행
-> 온보딩 완료
-> 첫 투두 생성
-> 첫 투두 완료
-> 펫방 방문
-> 말 걸기
-> 첫 진화
```

서버 분석 도구를 붙이기 전에는 로컬 debug log 또는 development console로 이벤트를 확인해도 된다.

## 핵심 이벤트

| 이벤트 | 의미 | 주요 속성 |
| --- | --- | --- |
| `app_opened` | 앱 실행 | `opened_at`, `has_completed_onboarding` |
| `onboarding_completed` | 온보딩 완료 | `duration_seconds` |
| `first_todo_created` | 첫 투두 작성 | `category_id`, `gyeol_type` |
| `first_todo_completed` | 첫 투두 완료 | `reward_type`, `gyeol_points` |
| `category_created` | 카테고리 생성 | `gyeol_type` |
| `core_seed_selected` | 핵심 씨앗 선택 | `date`, `core_seed_count` |
| `core_seed_completed` | 핵심 씨앗 완료 | `gyeol_type`, `gyeol_points` |
| `pet_room_viewed` | 펫방 방문 | `life_stage`, `primary_gyeol` |
| `pet_talk_tapped` | 말 걸기 클릭 | `dialogue_condition` |
| `gyeol_earned` | 결 획득 | `gyeol_type`, `reward_type`, `points` |
| `first_evolution_completed` | 첫 진화 완료 | `primary_gyeol`, `secondary_gyeol`, `result_form` |
| `new_journey_started` | 새 여정 시작 | `previous_result_form`, `new_species_id` |
| `store_viewed` | 상점 방문 | `source_tab` |
| `purchase_completed` | 구매 완료 | 후속 단계에서만 사용 |

## 초기 최우선 지표

| 지표 | 의미 | 낮을 때 의심할 것 |
| --- | --- | --- |
| 첫 투두 생성률 | 온보딩 이해도 | 첫 화면이 복잡하거나 입력 CTA가 약함 |
| 첫 투두 완료률 | 핵심 루프 진입 | 완료 버튼, 첫 투두 난이도, 보상 반응이 약함 |
| 펫방 방문률 | 펫 애착 시작 | 펫 존재감 또는 이동 동기가 약함 |
| 말 걸기 클릭률 | 소통 매력 | 버튼 위치, 대사, 애니메이션이 약함 |
| 첫 진화 도달률 | 장기 루프 성공 | 점수 조건이 과하거나 진화 기대감이 부족함 |
| D1/D7 리텐션 | 앱 생존 가능성 | 투두와 펫 루프의 반복성이 부족함 |

## MVP QA 시나리오

### 첫 사용자

1. 앱을 새로 설치한 상태로 실행한다.
2. 온보딩에서 첫 할 일을 입력한다.
3. 첫 할 일을 완료한다.
4. 솜알이 솜몽으로 바뀌는지 확인한다.
5. 오늘 화면으로 이동하는지 확인한다.

수용 기준: 사용자는 가입이나 설정 없이 첫 완료까지 갈 수 있다.

### 핵심 씨앗

1. 오늘 할 일을 4개 만든다.
2. 3개를 핵심 씨앗으로 선택한다.
3. 4번째를 핵심 씨앗으로 선택하려고 한다.

수용 기준: 4번째 선택은 막히고 부드러운 안내 문구가 나온다.

### 점수 계산

1. 일반 todo를 완료한다.
2. 핵심 씨앗 todo를 완료한다.
3. 생성 직후 바로 완료한 todo를 완료한다.
4. 같은 카테고리 todo를 여러 개 완료한다.

수용 기준: 핵심 씨앗은 높은 점수, 즉시 완료는 snack, 반복 카테고리는 감쇠가 적용된다.

### 성장기 진화

1. 테스트 seed data로 `create` 결 점수를 가장 높게 만든다.
2. 완료 개수와 점수 기준을 충족한다.
3. 진화 판정을 실행한다.

수용 기준: 메이커솜 계열 성장기 결과가 나오고 `evolution_history`에 기록된다.

### 새 여정

1. 성장기 펫이 있는 상태에서 기록 화면으로 간다.
2. 새 여정 CTA를 누른다.
3. 확인 dialog를 승인한다.

수용 기준: 기존 펫은 기록의 방에 남고 새 펫 인스턴스가 시작된다.

### 복귀 경험

1. 마지막 앱 실행 날짜를 며칠 전으로 조정한다.
2. 앱을 다시 실행한다.

수용 기준: 펫 사망, 벌점, 공격적 문구가 없다. 환영과 재시작 문구가 나온다.

## 도메인 테스트 케이스

| 모듈 | 테스트 |
| --- | --- |
| `scoring.ts` | difficulty별 기본 점수, 핵심 씨앗 보너스, instant completion multiplier |
| `scoring.ts` | daily cap, category diminishing returns, recovery bonus |
| `evolution.ts` | 기준 미달 noEvolution, 기준 충족 evolve |
| `evolution.ts` | primary/secondary 결 산출, 동률 처리 |
| `lifecycle.ts` | egg -> baby 부화, baby -> growth 진화, archived 처리 |
| `dialogue.ts` | 첫 접속, 핵심 씨앗 완료, snack heavy, 복귀 대사 선택 |
| `repositories.ts` | 완료 transaction 중복 방지, core seed 3개 제한 |

## UI QA 체크리스트

- 오늘 화면에서 투두 입력이 2탭 이하로 시작된다.
- 완료 반응은 즉시 보인다.
- 펫방에서 펫이 화면의 중심 시각 요소로 보인다.
- 텍스트가 버튼이나 카드 안에서 잘리지 않는다.
- 작은 화면에서도 하단 탭과 주요 CTA가 겹치지 않는다.
- 빈 상태 문구가 사용자를 탓하지 않는다.
- 상점은 결제를 유도하지 않고 coming soon으로 보인다.

## 윤리 QA 체크리스트

- 실패, 미완료, 복귀 상황에서 벌점처럼 느껴지는 언어가 없다.
- 진화 성능, 핵심 성장, 새 여정 시작을 결제와 연결하지 않는다.
- 무료 사용자도 7개 결 성장기 진화를 경험할 수 있다.
- 새 여정은 삭제가 아니라 보관으로 표현된다.
- 사용자를 감시하거나 인증하게 만드는 어뷰징 방지 UX가 없다.

## 출시 전 확인

실제 베타 또는 출시 단계에서는 다음 공식 문서를 최신 기준으로 다시 확인한다.

- Expo EAS Build
- Expo Router
- Expo SQLite
- Supabase Auth and RLS
- RevenueCat React Native SDK
- Apple App Review Guidelines
- Google Play Payments Policy
