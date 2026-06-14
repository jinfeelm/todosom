# 도메인 모델과 TypeScript 타입

## 설계 원칙

- 도메인 로직은 UI 컴포넌트 밖에 둔다.
- 점수 계산, 진화 판정, 대사 선택은 순수 함수로 테스트 가능해야 한다.
- UI는 domain 결과를 표시하고 사용자 입력을 전달하는 역할에 집중한다.
- 저장소는 local-first를 기본으로 하며, 서버 동기화는 후속 단계에서 붙인다.

## 권장 폴더 구조

```text
src/
  app/
    _layout.tsx
    index.tsx
    onboarding.tsx
    today.tsx
    pet-room.tsx
    archive.tsx
    store.tsx
  components/
    todo/
      TodoItem.tsx
      TodoInputSheet.tsx
      CoreSeedPicker.tsx
    pet/
      PetSprite.tsx
      PetRoom.tsx
      PetSpeechBubble.tsx
      EvolutionModal.tsx
  domain/
    gyeol/
      types.ts
      scoring.ts
      evolution.ts
    pet/
      species.ts
      dialogue.ts
      lifecycle.ts
  db/
    schema.ts
    migrations.ts
    localDb.ts
    repositories.ts
  stores/
    todoStore.ts
    petStore.ts
    settingsStore.ts
  assets/
    pets/
    rooms/
    icons/
  theme/
```

## 핵심 enum 타입

```ts
export type GyeolType =
  | 'focus'
  | 'create'
  | 'learn'
  | 'breakthrough'
  | 'care'
  | 'connect'
  | 'organize';

export type RewardType =
  | 'snack'
  | 'small_evolution'
  | 'deep_evolution'
  | 'recovery';

export type LifeStage =
  | 'egg'
  | 'baby'
  | 'growth'
  | 'mature'
  | 'archived';

export type TodoStatus =
  | 'open'
  | 'completed'
  | 'mist'
  | 'archived';

export type Difficulty =
  | 'light'
  | 'normal'
  | 'deep';
```

## 결 매핑

| `GyeolType` | 백서 용어 | 의미 | 대표 카테고리 | 성장기 예시 |
| --- | --- | --- | --- | --- |
| `focus` | 몰입결 | 깊게 집중하는 일 | 공부, 분석, 글쓰기, 코딩 | 렌즈솜 |
| `create` | 창작결 | 무언가 만드는 일 | 영상, 디자인, 콘텐츠, 기획 | 메이커솜 |
| `learn` | 배움결 | 배우고 익히는 일 | 독서, 강의, 리서치, 복습 | 노트솜 |
| `breakthrough` | 돌파결 | 미루거나 어려운 일 | 전화, 행정, 마감, 어려운 결정 | 불씨솜 |
| `care` | 돌봄결 | 몸과 마음을 챙기는 일 | 운동, 수면, 산책, 식사 | 숨솜 |
| `connect` | 연결결 | 사람과 이어지는 일 | 회의, 연락, 피드백, 영업 | 링솜 |
| `organize` | 정돈결 | 흐트러진 것을 정리하는 일 | 청소, 파일 정리, 일정 정리 | 큐브솜 |

## 엔티티 타입

```ts
export interface User {
  id: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  gyeolType: GyeolType;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  dueDate: string;
  isCoreSeed: boolean;
  difficulty: Difficulty;
  status: TodoStatus;
  plannedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCompletion {
  id: string;
  todoId: string;
  userId: string;
  completedAt: string;
  rewardType: RewardType;
  gyeolType: GyeolType;
  gyeolPoints: number;
  reason: string;
}

export interface PetSpecies {
  id: string;
  name: string;
  assetKey: string;
  isPaid: boolean;
  productId: string | null;
}

export interface PetInstance {
  id: string;
  userId: string;
  speciesId: string;
  name: string | null;
  lifeStage: LifeStage;
  primaryGyeol: GyeolType | null;
  secondaryGyeol: GyeolType | null;
  affection: number;
  startedAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GyeolScoreEvent {
  id: string;
  userId: string;
  petInstanceId: string;
  todoId: string | null;
  gyeolType: GyeolType;
  rewardType: RewardType;
  points: number;
  reason: string;
  occurredAt: string;
}

export interface EvolutionHistory {
  id: string;
  userId: string;
  petInstanceId: string;
  fromStage: LifeStage;
  toStage: LifeStage;
  resultForm: string;
  primaryGyeol: GyeolType;
  secondaryGyeol: GyeolType | null;
  evolvedAt: string;
}
```

## 파생 뷰 모델

UI는 DB entity를 직접 많이 조합하지 말고 화면에 필요한 view model로 변환한다.

```ts
export interface TodayTodoView {
  todo: Todo;
  category: Category;
  gyeolLabel: string;
  canMarkCoreSeed: boolean;
}

export interface PetRoomView {
  pet: PetInstance;
  species: PetSpecies;
  todayScores: Record<GyeolType, number>;
  currentDialogue: string;
  assetKey: string;
  canEvolve: boolean;
}

export interface ArchivePetCardView {
  petInstanceId: string;
  displayName: string;
  lifeStage: LifeStage;
  resultForm: string | null;
  primaryGyeol: GyeolType | null;
  archivedAt: string | null;
}
```

## 주요 도메인 서비스

| 모듈 | 책임 |
| --- | --- |
| `domain/gyeol/scoring.ts` | 완료된 todo를 reward와 점수 이벤트로 변환 |
| `domain/gyeol/evolution.ts` | 최근 결 점수로 진화 가능 여부와 결과 판정 |
| `domain/pet/dialogue.ts` | 현재 상태에 맞는 펫 대사 선택 |
| `domain/pet/lifecycle.ts` | 부화, 진화, 새 여정, archive 상태 전환 |
| `db/repositories.ts` | SQLite 읽기/쓰기 transaction 제공 |
| `stores/todoStore.ts` | 오늘 투두 목록과 입력 상태 관리 |
| `stores/petStore.ts` | 현재 펫, 펫방 view model, 진화 modal 상태 관리 |

## 상태 흐름

### 첫 사용

```text
앱 실행
-> local DB 초기화
-> user 없으면 local user 생성
-> 기본 species 솜몽 seed
-> pet_instance life_stage egg 생성
-> onboarding 시작
```

### 첫 완료

```text
todo 생성
-> todo 완료
-> scoreTodoCompletion()
-> todo_completions insert
-> gyeol_score_events insert
-> pet egg이면 baby로 부화
-> pet dialogue 갱신
```

### 성장기 진화

```text
펫방 또는 완료 직후 evolution check
-> 최근 점수 aggregate
-> 조건 미충족이면 noEvolution
-> 조건 충족이면 primary/secondary gyeol 산출
-> result form 결정
-> evolution_history insert
-> pet_instance life_stage growth update
-> evolution modal 표시
```

### 새 여정

```text
사용자가 새 여정 CTA 선택
-> 확인 dialog
-> 기존 pet_instance archivedAt 설정, life_stage archived
-> 새 pet_instance 생성
-> 유료 species는 MVP에서 선택 불가 또는 locked
-> 기록 화면에 이전 여정 카드 표시
```

## 도메인 불변 조건

- 하루 핵심 씨앗은 사용자별 날짜별 3개를 초과할 수 없다.
- 완료된 todo는 같은 완료 이벤트를 중복 생성하지 않는다.
- `gyeol_score_events`는 삭제보다 보정 이벤트 추가를 우선한다.
- `pet_instances.archivedAt`이 있으면 현재 펫으로 사용하지 않는다.
- 진화 기록은 append-only로 취급한다.
- 결제 여부는 진화 점수에 영향을 주지 않는다.
