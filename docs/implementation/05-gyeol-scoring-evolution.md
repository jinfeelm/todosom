# 결 점수와 진화 로직

## 목적

결 시스템은 TodoSom의 핵심이다. 사용자가 완료한 할 일을 단순한 개수가 아니라 성향과 질로 해석해 펫의 성장을 결정한다.

## 7개 결

| 결 | 타입 | 의미 | 대표 카테고리 | 성장기 예시 |
| --- | --- | --- | --- | --- |
| 몰입결 | `focus` | 깊게 집중하는 일 | 공부, 분석, 글쓰기, 코딩 | 렌즈솜 |
| 창작결 | `create` | 무언가 만드는 일 | 영상, 디자인, 콘텐츠, 기획 | 메이커솜 |
| 배움결 | `learn` | 배우고 익히는 일 | 독서, 강의, 리서치, 복습 | 노트솜 |
| 돌파결 | `breakthrough` | 미루거나 어려운 일 | 전화, 행정, 마감, 어려운 결정 | 불씨솜 |
| 돌봄결 | `care` | 몸과 마음을 챙기는 일 | 운동, 수면, 산책, 식사 | 숨솜 |
| 연결결 | `connect` | 사람과 이어지는 일 | 회의, 연락, 피드백, 영업 | 링솜 |
| 정돈결 | `organize` | 흐트러진 것을 정리하는 일 | 청소, 파일 정리, 일정 정리 | 큐브솜 |

## 보상 타입

| 보상 | 조건 | 사용자 감정 | 진화 반영 |
| --- | --- | --- | --- |
| `snack` | 방금 만들고 바로 완료, 반복적이고 가벼운 일 | 인정받음 | 낮음 |
| `small_evolution` | 일반 할 일을 계획 후 완료 | 성장함 | 보통 |
| `deep_evolution` | 핵심 씨앗, 묵직한 일, 미뤄둔 일 완료 | 해냈다는 감각 | 높음 |
| `recovery` | 미룬 일을 재예약/쪼개기 후 완료 | 다시 시작함 | 특수 보정 |

## 점수 기본값

MVP에서는 튜닝 가능한 상수로 시작한다. 수치는 코드 상수로 분리하고, 테스트에서 고정한다.

```ts
export const SCORING = {
  difficultyPoints: {
    light: 1,
    normal: 3,
    deep: 5,
  },
  coreSeedBonus: 4,
  plannedAheadBonus: 1,
  recoveryBonus: 3,
  instantCompletionMultiplier: 0.2,
  sameCategoryDiminishingStart: 4,
  sameCategoryDiminishingMultiplier: 0.7,
  dailyEvolutionPointCap: 18,
  minCompletionCountForGrowth: 5,
  minEvolutionPointsForGrowth: 20,
  growthObservationDays: 7,
} as const;
```

## 점수 계산 규칙

| 상황 | 처리 방식 | 의도 |
| --- | --- | --- |
| 생성 1분 안에 완료 | `snack` 또는 낮은 진화점수 | 즉시완료 남발 방지 |
| 하루 완료 수 과다 | 일일 성장 상한 적용 | 체크박스 폭주 방지 |
| 같은 카테고리 과도 반복 | 점진적 감쇠 | 단일 카테고리 어뷰징 완화 |
| 핵심 씨앗 완료 | 강한 진화 보너스 | 중요한 일 중심 성장 |
| 전날/아침 계획한 일 완료 | 신뢰도 보너스 | 계획성 반영 |
| 미룬 일 재정리 후 완료 | 회복결 보너스 | 복귀를 긍정적으로 반영 |

## 점수 계산 의사코드

```ts
export function scoreTodoCompletion(input: {
  todo: Todo;
  category: Category;
  completedAt: Date;
  sameCategoryCompletionCountToday: number;
  currentDailyEvolutionPoints: number;
}): {
  rewardType: RewardType;
  gyeolType: GyeolType;
  points: number;
  reason: string;
} {
  let points = difficultyPoints(input.todo.difficulty);
  let rewardType: RewardType = 'small_evolution';
  const reasonParts: string[] = [];

  if (input.todo.isCoreSeed) {
    points += SCORING.coreSeedBonus;
    rewardType = 'deep_evolution';
    reasonParts.push('core_seed');
  }

  if (wasCreatedAndCompletedTooFast(input.todo, input.completedAt)) {
    points = Math.max(1, Math.floor(points * SCORING.instantCompletionMultiplier));
    rewardType = 'snack';
    reasonParts.push('instant_completion');
  }

  if (wasPlannedAhead(input.todo)) {
    points += SCORING.plannedAheadBonus;
    reasonParts.push('planned_ahead');
  }

  if (wasRescheduledFromMist(input.todo)) {
    points += SCORING.recoveryBonus;
    rewardType = 'recovery';
    reasonParts.push('recovery');
  }

  points = applyCategoryDiminishingReturns(
    points,
    input.sameCategoryCompletionCountToday,
  );

  points = applyDailyCap(points, input.currentDailyEvolutionPoints);

  return {
    rewardType,
    gyeolType: input.category.gyeolType,
    points,
    reason: reasonParts.join(',') || 'normal_completion',
  };
}
```

## 어뷰징 대응 언어

어뷰징 방지는 혼내는 말투가 아니어야 한다.

| 상황 | 금지 문구 | 권장 문구 |
| --- | --- | --- |
| 쉬운 일 반복 | 너무 쉬운 일이라 점수가 낮습니다 | 작은 간식결을 많이 먹었어요. 몸의 결을 바꾸려면 묵직한 씨앗도 필요해요 |
| 핵심 씨앗 3개 초과 | 더 선택할 수 없습니다 | 오늘 가장 빛나게 만들 씨앗은 세 개면 충분해요 |
| 일일 상한 도달 | 오늘 점수 획득 불가 | 오늘은 이미 결이 포근하게 찼어요. 나머지는 가볍게 정리해도 좋아요 |

## 성장기 진화 조건

| 조건 | 권장값 | 설명 |
| --- | --- | --- |
| 관찰 기간 | 첫 7일 또는 진화결 20점 | 너무 빨리 갈라지지 않게 한다 |
| 주요 결 기준 | 가장 높은 결 1개 | 성장기 본체 결정 |
| 보조 결 기준 | 2위 결 또는 특수 결 | 무늬, 오라, 작은 장식 |
| 동률 처리 | 핵심 씨앗 점수가 많은 결 우선 | 사용자의 의도를 반영 |
| 최소 활동 기준 | 완료 5개 이상 | 초반 우연 진화 방지 |

## 진화 판정 의사코드

```ts
export function evaluateGrowthEvolution(input: {
  pet: PetInstance;
  events: GyeolScoreEvent[];
  completions: TodoCompletion[];
  now: Date;
}): EvolutionDecision {
  if (input.pet.lifeStage !== 'baby') {
    return { kind: 'not_ready', reason: 'invalid_life_stage' };
  }

  const recentEvents = filterObservationWindow(input.events, input.pet.startedAt, input.now);
  const totalPoints = sumEvolutionPoints(recentEvents);
  const completionCount = input.completions.length;
  const daysSinceStart = diffDays(input.pet.startedAt, input.now);

  const hasEnoughDays = daysSinceStart >= SCORING.growthObservationDays;
  const hasEnoughPoints = totalPoints >= SCORING.minEvolutionPointsForGrowth;
  const hasEnoughCompletions = completionCount >= SCORING.minCompletionCountForGrowth;

  if (!(hasEnoughCompletions && (hasEnoughDays || hasEnoughPoints))) {
    return { kind: 'not_ready', reason: 'threshold_not_met' };
  }

  const scores = aggregateByGyeol(recentEvents);
  const primary = choosePrimaryGyeol(scores, recentEvents);
  const secondary = chooseSecondaryGyeol(scores, primary);
  const resultForm = growthFormFor(input.pet.speciesId, primary);
  const variant = variantFor(secondary, recentEvents);

  return {
    kind: 'evolve',
    fromStage: 'baby',
    toStage: 'growth',
    primaryGyeol: primary,
    secondaryGyeol: secondary,
    resultForm,
    variant,
  };
}
```

## 진화 결과 예시

| 사용자 패턴 | 주요 결 | 보조 결 | 결과 |
| --- | --- | --- | --- |
| 쇼츠 기획, 썸네일, 카페 콘텐츠 작성 | `create` | `focus` | 메이커솜 + 렌즈 무늬 |
| 시험 공부, 강의, 복습, 오답노트 | `learn` | `focus` | 노트솜 + 조용한 빛 |
| 운동, 산책, 수면 루틴 | `care` | `organize` | 숨솜 + 정리 리본 |
| 밀린 전화, 행정 처리, 마감 작업 | `breakthrough` | `organize` | 불씨솜 + 큐브 꼬리 |

## 진화 결과 저장

진화가 발생하면 한 transaction 안에서 다음을 처리한다.

1. `evolution_history`에 from/to stage, result form, primary/secondary gyeol 저장
2. `pet_instances`의 `life_stage`, `primary_gyeol`, `secondary_gyeol`, `updated_at` 갱신
3. 진화 modal 표시를 위한 store 상태 갱신

## 테스트해야 할 사례

- 핵심 씨앗 완료가 일반 완료보다 높은 점수를 만든다.
- 생성 1분 안에 완료한 todo는 snack으로 처리된다.
- 같은 카테고리를 여러 번 완료하면 감쇠가 적용된다.
- 하루 상한을 넘는 점수는 잘린다.
- 7일 전에는 충분한 점수가 없으면 진화하지 않는다.
- 진화결 20점 이상과 완료 5개 이상이면 7일 전에도 성장기 진화가 가능하다.
- 동률이면 핵심 씨앗 점수가 많은 결이 primary가 된다.
- 진화 후 같은 펫은 중복으로 성장기 진화하지 않는다.
