# 로컬 데이터 저장소 설계

## 저장소 방향

MVP는 `expo-sqlite` 기반 local-first 앱으로 만든다. 서버, 로그인, 결제 없이도 모든 핵심 루프가 로컬 DB에서 동작해야 한다.

## 공통 규칙

- 모든 id는 문자열 UUID를 사용한다.
- 시간은 ISO 8601 문자열로 저장한다.
- 삭제보다 상태 변경과 archive를 우선한다.
- 점수와 진화 기록은 append-only에 가깝게 다룬다.
- 후속 Supabase 동기화를 고려해 `user_id`, `created_at`, `updated_at`을 기본으로 둔다.

## 테이블 목록

| 테이블 | 역할 |
| --- | --- |
| `users` | 로컬 사용자 |
| `categories` | 사용자 카테고리와 결 연결 |
| `todos` | 할 일 |
| `todo_completions` | 완료 기록 |
| `pet_species` | 펫 종족/유년기 타입 |
| `pet_instances` | 사용자가 실제 키우는 펫 |
| `gyeol_score_events` | 결 점수 이벤트 로그 |
| `evolution_history` | 진화 기록 |
| `rooms` | 펫방 |
| `inventory_items` | 보유 아이템 |
| `purchases` | 향후 구매 기록 placeholder |
| `settings` | 온보딩, 알림 등 로컬 설정 |

## SQLite 스키마 초안

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gyeol_type TEXT NOT NULL CHECK (gyeol_type IN (
    'focus', 'create', 'learn', 'breakthrough', 'care', 'connect', 'organize'
  )),
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  due_date TEXT NOT NULL,
  is_core_seed INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('light', 'normal', 'deep')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'mist', 'archived')),
  planned_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS todo_completions (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'snack', 'small_evolution', 'deep_evolution', 'recovery'
  )),
  gyeol_type TEXT NOT NULL,
  gyeol_points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  FOREIGN KEY (todo_id) REFERENCES todos(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pet_species (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  is_paid INTEGER NOT NULL DEFAULT 0,
  product_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pet_instances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  species_id TEXT NOT NULL,
  name TEXT,
  life_stage TEXT NOT NULL CHECK (life_stage IN ('egg', 'baby', 'growth', 'mature', 'archived')),
  primary_gyeol TEXT,
  secondary_gyeol TEXT,
  affection INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (species_id) REFERENCES pet_species(id)
);

CREATE TABLE IF NOT EXISTS gyeol_score_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pet_instance_id TEXT NOT NULL,
  todo_id TEXT,
  gyeol_type TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id),
  FOREIGN KEY (todo_id) REFERENCES todos(id)
);

CREATE TABLE IF NOT EXISTS evolution_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pet_instance_id TEXT NOT NULL,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  result_form TEXT NOT NULL,
  primary_gyeol TEXT NOT NULL,
  secondary_gyeol TEXT,
  evolved_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pet_instance_id TEXT NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'default_room',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'default',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT,
  product_id TEXT NOT NULL,
  entitlement_id TEXT,
  purchased_at TEXT,
  status TEXT NOT NULL DEFAULT 'placeholder',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 인덱스 후보

```sql
CREATE INDEX IF NOT EXISTS idx_categories_user_id
  ON categories(user_id);

CREATE INDEX IF NOT EXISTS idx_todos_user_due_status
  ON todos(user_id, due_date, status);

CREATE INDEX IF NOT EXISTS idx_todos_core_seed_date
  ON todos(user_id, due_date, is_core_seed);

CREATE UNIQUE INDEX IF NOT EXISTS idx_todo_completions_todo_once
  ON todo_completions(todo_id);

CREATE INDEX IF NOT EXISTS idx_score_events_pet_time
  ON gyeol_score_events(pet_instance_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_score_events_user_time
  ON gyeol_score_events(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_pet_instances_current
  ON pet_instances(user_id, archived_at, life_stage);

CREATE INDEX IF NOT EXISTS idx_evolution_history_pet
  ON evolution_history(pet_instance_id, evolved_at);
```

## Seed 데이터

앱 첫 실행 시 다음 데이터를 보장한다.

| 데이터 | 값 |
| --- | --- |
| local user | UUID 기반 익명 사용자 |
| 기본 category | `오늘`, `focus`, 기본 색상 |
| 기본 species | `som_mong`, `솜몽`, `asset_key = som_mong` |
| 기본 pet instance | `life_stage = egg`, `species_id = som_mong` |
| 기본 room | `theme_id = default_room` |
| onboarding setting | `onboarding_completed = false` |

## Repository 메서드

| repository | 메서드 |
| --- | --- |
| `userRepository` | `ensureLocalUser()`, `getCurrentUser()` |
| `categoryRepository` | `listCategories()`, `createCategory()`, `updateCategory()` |
| `todoRepository` | `listTodayTodos()`, `createTodo()`, `toggleCoreSeed()`, `completeTodo()` |
| `petRepository` | `getCurrentPet()`, `hatchIfNeeded()`, `updateLifeStage()`, `archiveCurrentPetAndStartNew()` |
| `scoreRepository` | `insertScoreEvent()`, `aggregateScoresForPet()`, `aggregateScoresForDate()` |
| `evolutionRepository` | `insertEvolutionHistory()`, `listEvolutionHistory()` |
| `roomRepository` | `getCurrentRoom()`, `ensureDefaultRoom()` |
| `settingsRepository` | `getSetting()`, `setSetting()` |

## 중요 transaction

### 완료 처리

한 transaction으로 묶는다.

1. `todos.status = completed`, `completed_at`, `updated_at` 갱신
2. 점수 계산
3. `todo_completions` insert
4. `gyeol_score_events` insert
5. 필요 시 `pet_instances.life_stage`를 `egg`에서 `baby`로 갱신
6. 진화 조건 평가는 같은 transaction 후 실행해도 된다

### 진화 처리

한 transaction으로 묶는다.

1. 이미 같은 pet에 성장기 진화 기록이 있는지 확인
2. `evolution_history` insert
3. `pet_instances.life_stage`, `primary_gyeol`, `secondary_gyeol` update
4. UI store에 modal 표시 데이터 반환

### 새 여정

한 transaction으로 묶는다.

1. 현재 pet의 `life_stage = archived`, `archived_at` 설정
2. 새 `pet_instances` 생성
3. 새 `rooms` 생성
4. 기록 화면 갱신

## 마이그레이션 관리

`db/migrations.ts`는 번호가 있는 migration 배열로 관리한다.

```ts
export interface Migration {
  id: number;
  name: string;
  up: string[];
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial_local_mvp_schema',
    up: [
      'CREATE TABLE IF NOT EXISTS users (...)',
      'CREATE TABLE IF NOT EXISTS categories (...)',
    ],
  },
];
```

`settings` 또는 별도 `schema_migrations` 테이블에 마지막 적용 migration id를 저장한다.

## local-first 확장 메모

- Supabase 동기화 전까지 `user_id`는 로컬 익명 user id로 사용한다.
- 나중에 로그인하면 local user id를 remote user id에 매핑하는 migration 또는 sync layer를 둔다.
- RLS 적용 전제 때문에 모든 사용자 소유 테이블에 `user_id`를 유지한다.
- RevenueCat entitlement는 `purchases`와 `inventory_items`를 직접 분리해 관리한다.
