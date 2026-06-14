import type { GyeolType, LifeStage } from '@/domain/gyeol/types';

export type DialogueCondition =
  | 'first_visit'
  | 'onboarding_hatch'
  | 'core_seed_completed'
  | 'snack_heavy'
  | 'return_after_absence'
  | 'idle'
  | 'evolution_ready'
  | 'growth_stage';

export interface DialogueEntry {
  id: string;
  condition: DialogueCondition;
  gyeolType?: GyeolType;
  minAffection?: number;
  text: string;
  animationState: 'idle' | 'happy' | 'talk' | 'eat' | 'sleep' | 'evolve';
}

export const DIALOGUE_ENTRIES: DialogueEntry[] = [
  {
    id: 'onboarding_1',
    condition: 'onboarding_hatch',
    text: '나 솜몽이야. 오늘 씨앗이 나를 바꿀 거야.',
    animationState: 'happy',
  },
  {
    id: 'first_visit',
    condition: 'first_visit',
    text: '안녕, 나 솜몽이야. 오늘 씨앗 하나 같이 심자.',
    animationState: 'idle',
  },
  {
    id: 'core_seed_done',
    condition: 'core_seed_completed',
    text: '핵심 씨앗에서 결이 피어났어. 정말 빛나.',
    animationState: 'happy',
  },
  {
    id: 'snack_heavy',
    condition: 'snack_heavy',
    text: '간식결은 많이 먹었어. 묵직한 씨앗도 필요해.',
    animationState: 'eat',
  },
  {
    id: 'return',
    condition: 'return_after_absence',
    text: '다시 왔구나. 오늘 하나만 같이 해보자.',
    animationState: 'talk',
  },
  {
    id: 'evolution_ready',
    condition: 'evolution_ready',
    text: '몸 안의 결이 모였어. 새 모습이 될 준비가 됐어.',
    animationState: 'evolve',
  },
  {
    id: 'growth',
    condition: 'growth_stage',
    text: '같은 솜뭉치가 다른 하루를 먹고 다르게 자랐어.',
    animationState: 'happy',
  },
  {
    id: 'idle_default',
    condition: 'idle',
    text: '오늘 씨앗이 나를 조금씩 바꾸고 있어.',
    animationState: 'idle',
  },
];

export const GUILT_COPY_FORBIDDEN = [
  '실패',
  '왜 안 했',
  '연속 기록이 깨졌',
  '벌점',
  '죽었',
  '사망',
  '너무 쉬운 일',
];

export interface SelectDialogueInput {
  lifeStage: LifeStage;
  isFirstVisit: boolean;
  isOnboardingHatch: boolean;
  coreSeedJustCompleted: boolean;
  snackCountToday: number;
  daysSinceLastVisit: number;
  canEvolve: boolean;
}

export function selectDialogue(input: SelectDialogueInput): DialogueEntry {
  if (input.isOnboardingHatch) {
    return findByCondition('onboarding_hatch');
  }
  if (input.daysSinceLastVisit >= 2) {
    return findByCondition('return_after_absence');
  }
  if (input.canEvolve) {
    return findByCondition('evolution_ready');
  }
  if (input.lifeStage === 'growth' || input.lifeStage === 'mature') {
    return findByCondition('growth_stage');
  }
  if (input.coreSeedJustCompleted) {
    return findByCondition('core_seed_completed');
  }
  if (input.snackCountToday >= 3) {
    return findByCondition('snack_heavy');
  }
  if (input.isFirstVisit) {
    return findByCondition('first_visit');
  }
  return findByCondition('idle');
}

function findByCondition(condition: DialogueCondition): DialogueEntry {
  const entry = DIALOGUE_ENTRIES.find((d) => d.condition === condition);
  if (!entry) {
    return DIALOGUE_ENTRIES[DIALOGUE_ENTRIES.length - 1];
  }
  return entry;
}

export function containsGuiltCopy(text: string): boolean {
  return GUILT_COPY_FORBIDDEN.some((phrase) => text.includes(phrase));
}

export function validateAllDialogueCopy(): string[] {
  const violations: string[] = [];
  for (const entry of DIALOGUE_ENTRIES) {
    for (const phrase of GUILT_COPY_FORBIDDEN) {
      if (entry.text.includes(phrase)) {
        violations.push(`${entry.id}: contains "${phrase}"`);
      }
    }
  }
  return violations;
}
