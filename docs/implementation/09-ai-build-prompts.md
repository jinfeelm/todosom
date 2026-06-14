# AI 구현 프롬프트와 작업 분해

## 사용 원칙

AI 코딩 도구에는 "귀여운 투두 앱"처럼 넓은 요청을 주지 않는다. TodoSom은 도메인 로직, DB, 화면, 아트 placeholder가 서로 연결되는 앱이므로 작은 작업 단위로 나눠 요청한다.

## 전체 시작 프롬프트

```text
Build a mobile app prototype called TodoSom using Expo, React Native, TypeScript, and Expo Router.

TodoSom is a cozy high-quality pixel-art todo pet app. Users create todos, map categories to seven gyeol types, select 1 to 3 core seeds each day, complete todos to earn gyeol points, and evolve a shared baby cotton pet into growth forms based on dominant gyeol.

Build a local-first MVP with expo-sqlite and Zustand. Do not add login, purchases, social features, AI free chat, or server sync in the first prototype.

Separate domain logic from UI components. Scoring, evolution, lifecycle, and dialogue selection must be pure TypeScript functions with tests. The app should include tabs for Today, Pet Room, Archive, and Store placeholder.
```

## 구현 작업 순서

### 1. 프로젝트 골격

```text
Create an Expo Router TypeScript app structure for TodoSom.

Add routes:
- onboarding
- today
- pet-room
- archive
- store

Add bottom tabs for Today, Pet Room, Archive, and Store. Store is a placeholder only.

Create folders:
- src/components/todo
- src/components/pet
- src/domain/gyeol
- src/domain/pet
- src/db
- src/stores
- src/theme

Do not implement server auth or purchases.
```

### 2. 도메인 타입

```text
Implement TodoSom domain types in TypeScript.

Include:
- GyeolType: focus, create, learn, breakthrough, care, connect, organize
- RewardType: snack, small_evolution, deep_evolution, recovery
- LifeStage: egg, baby, growth, mature, archived
- Todo, Category, TodoCompletion, PetSpecies, PetInstance, GyeolScoreEvent, EvolutionHistory

Keep these in src/domain/gyeol/types.ts or a nearby shared domain types file. Do not put UI code in this step.
```

### 3. SQLite 스키마

```text
Implement expo-sqlite local database initialization for TodoSom.

Create tables:
users, categories, todos, todo_completions, pet_species, pet_instances, gyeol_score_events, evolution_history, rooms, inventory_items, purchases, settings.

Add indexes for today todo lookup, core seed lookup, score event aggregation, current pet lookup, and evolution history lookup.

Add seed data:
- local anonymous user
- default category "오늘" mapped to focus
- default pet species som_mong
- default pet instance with life_stage egg
- default room
- onboarding_completed false
```

### 4. 점수 로직

```text
Implement pure scoring logic for TodoSom.

Rules:
- difficulty light/normal/deep maps to 1/3/5 points
- core seed adds a strong bonus
- todos created and completed too quickly become snack reward with low evolution points
- same category repeated too much in a day gets diminishing returns
- daily evolution points are capped
- rescheduled or recovered tasks get recovery reward/bonus

Return rewardType, gyeolType, points, and reason. Add unit tests for edge cases.
```

### 5. 진화 로직

```text
Implement pure evolution logic for TodoSom.

Growth evolution can happen when:
- pet life stage is baby
- completion count is at least 5
- either 7 days have passed or total evolution points are at least 20

Pick primary gyeol from the highest score. Pick secondary gyeol from second highest score. If tied, prefer the gyeol with more core seed points.

Map primary gyeol to growth forms:
- focus -> lens_som
- create -> maker_som
- learn -> note_som
- breakthrough -> spark_som
- care -> breath_som
- connect -> ring_som
- organize -> cube_som

Return noEvolution or evolve decision. Add tests.
```

### 6. Repository와 transaction

```text
Implement local repositories for TodoSom.

Required operations:
- ensureLocalUser
- listTodayTodos
- createTodo
- toggleCoreSeed with max 3 per day
- completeTodo as a transaction
- getCurrentPet
- hatchPetIfNeeded
- evaluateAndApplyEvolution
- archiveCurrentPetAndStartNew
- aggregateTodayGyeolScores

completeTodo must update todos, insert todo_completions, insert gyeol_score_events, and hatch the pet from egg to baby if needed.
```

### 7. 오늘 화면

```text
Build the Today screen.

Requirements:
- show today date and a short pet status line
- show core seeds first
- show normal todos below
- add a seed button that opens a simple input sheet
- input fields: title, category, due date default today, core seed toggle, difficulty optional
- completing a todo shows a gyeol earned toast
- empty state uses gentle TodoSom copy

Do not add repeat, subtasks, projects, or team features.
```

### 8. 펫방 화면

```text
Build the Pet Room screen.

Requirements:
- show current pet sprite placeholder
- show room background placeholder
- show today's gyeol score summary
- add Talk button that displays condition-based dialogue
- show evolution modal when growth evolution is applied
- keep the pet visually central and emotionally important

Use placeholder pixel-style assets if real assets are not available.
```

### 9. 기록 화면과 새 여정

```text
Build the Archive screen.

Requirements:
- show current journey card
- show previous archived pet cards
- show evolution history details
- add New Journey CTA after growth stage
- confirmation copy must say the pet is stored in the archive, not deleted
- new journey is free and creates a new pet instance

Do not implement paid reset or permanent deletion in MVP.
```

### 10. QA 마무리

```text
Run through TodoSom MVP QA:
- first launch onboarding
- first todo creation
- first todo completion
- egg to baby hatch
- core seed max 3 rule
- snack reward for instant completion
- growth evolution with seeded data
- archive and new journey
- no guilt copy on return after absence

Fix any behavior that conflicts with the product principles.
```

## 구현 금지 프롬프트

다음 요청은 MVP 구현 중 사용하지 않는다.

- "Add social leaderboard"
- "Add paid evolution boost"
- "Add gacha pet draw"
- "Add AI free chat with the pet"
- "Add full room decoration editor"
- "Make the pet die if the user does not return"
- "Add team collaboration/project management"

## 코드 리뷰 프롬프트

```text
Review this TodoSom implementation against the MVP docs.

Focus on:
- Does it preserve the core loop: todo -> gyeol -> pet reaction -> evolution -> archive?
- Are scoring and evolution pure and testable?
- Does any paid or store code affect evolution performance?
- Are failure and return states written without guilt?
- Are local DB transactions safe from duplicate completion events?
- Is core seed limited to 1 to 3 per day?
- Are deferred features accidentally implemented in a way that bloats MVP?

Report bugs, risks, and missing tests first.
```

## AI 작업 산출물 기준

- 타입과 DB schema가 문서와 충돌하지 않아야 한다.
- 점수와 진화 로직에는 단위 테스트가 있어야 한다.
- 화면은 기능 설명용 랜딩 페이지가 아니라 실제 앱 화면이어야 한다.
- 상점은 placeholder이며 결제 흐름을 만들지 않는다.
- 사용자를 탓하는 문구가 들어가면 수정한다.
- 기본 펫과 무료 경험이 제품의 중심으로 보여야 한다.
