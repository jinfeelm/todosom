import type { GyeolType } from '@/domain/gyeol/types';

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
  instantCompletionThresholdMs: 60_000,
  sameCategoryDiminishingStart: 4,
  sameCategoryDiminishingMultiplier: 0.7,
  dailyEvolutionPointCap: 18,
  minCompletionCountForGrowth: 5,
  minEvolutionPointsForGrowth: 20,
  growthObservationDays: 7,
  maxCoreSeedsPerDay: 3,
} as const;

export const GROWTH_FORM_MAP: Record<GyeolType, string> = {
  focus: 'lens_som',
  create: 'maker_som',
  learn: 'note_som',
  breakthrough: 'spark_som',
  care: 'breath_som',
  connect: 'ring_som',
  organize: 'cube_som',
};

export const GROWTH_DISPLAY_NAMES: Record<string, string> = {
  lens_som: '렌즈솜',
  maker_som: '메이커솜',
  note_som: '노트솜',
  spark_som: '불씨솜',
  breath_som: '숨솜',
  ring_som: '링솜',
  cube_som: '큐브솜',
};
