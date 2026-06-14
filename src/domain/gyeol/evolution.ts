import { GROWTH_FORM_MAP, SCORING } from '@/domain/gyeol/constants';
import type {
  GyeolScoreEvent,
  GyeolType,
  LifeStage,
  PetInstance,
  TodoCompletion,
} from '@/domain/gyeol/types';
import { diffDays } from '@/lib/clock';

export type EvolutionDecision =
  | { kind: 'not_ready'; reason: string }
  | {
      kind: 'evolve';
      fromStage: LifeStage;
      toStage: 'growth';
      primaryGyeol: GyeolType;
      secondaryGyeol: GyeolType | null;
      resultForm: string;
      variant: string | null;
    };

export interface EvaluateGrowthEvolutionInput {
  pet: PetInstance;
  events: GyeolScoreEvent[];
  completions: TodoCompletion[];
  existingEvolutionCount: number;
  now: Date;
}

function aggregateByGyeol(events: GyeolScoreEvent[]): Record<GyeolType, number> {
  const scores: Record<GyeolType, number> = {
    focus: 0,
    create: 0,
    learn: 0,
    breakthrough: 0,
    care: 0,
    connect: 0,
    organize: 0,
  };
  for (const event of events) {
    scores[event.gyeolType] += event.points;
  }
  return scores;
}

function coreSeedPointsByGyeol(events: GyeolScoreEvent[]): Record<GyeolType, number> {
  const scores: Record<GyeolType, number> = {
    focus: 0,
    create: 0,
    learn: 0,
    breakthrough: 0,
    care: 0,
    connect: 0,
    organize: 0,
  };
  for (const event of events) {
    if (event.reason.includes('core_seed')) {
      scores[event.gyeolType] += event.points;
    }
  }
  return scores;
}

function choosePrimaryGyeol(
  scores: Record<GyeolType, number>,
  events: GyeolScoreEvent[],
): GyeolType {
  const coreSeedScores = coreSeedPointsByGyeol(events);
  let best: GyeolType = 'focus';
  let bestScore = -1;
  let bestCore = -1;

  for (const type of Object.keys(scores) as GyeolType[]) {
    const score = scores[type];
    const core = coreSeedScores[type];
    if (score > bestScore || (score === bestScore && core > bestCore)) {
      best = type;
      bestScore = score;
      bestCore = core;
    }
  }
  return best;
}

function chooseSecondaryGyeol(
  scores: Record<GyeolType, number>,
  primary: GyeolType,
): GyeolType | null {
  const entries = (Object.entries(scores) as [GyeolType, number][])
    .filter(([type]) => type !== primary)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0 || entries[0][1] <= 0) {
    return null;
  }
  return entries[0][0];
}

function variantFor(secondary: GyeolType | null): string | null {
  if (!secondary) {
    return null;
  }
  return `${secondary}_variant`;
}

export function growthFormFor(primary: GyeolType): string {
  return GROWTH_FORM_MAP[primary];
}

export function sumEvolutionPoints(events: GyeolScoreEvent[]): number {
  return events.reduce((sum, e) => sum + e.points, 0);
}

export function evaluateGrowthEvolution(
  input: EvaluateGrowthEvolutionInput,
): EvolutionDecision {
  if (input.pet.lifeStage !== 'baby') {
    return { kind: 'not_ready', reason: 'invalid_life_stage' };
  }

  if (input.existingEvolutionCount > 0) {
    return { kind: 'not_ready', reason: 'already_evolved' };
  }

  const totalPoints = sumEvolutionPoints(input.events);
  const completionCount = input.completions.length;
  const daysSinceStart = diffDays(input.pet.startedAt, input.now);

  const hasEnoughDays = daysSinceStart >= SCORING.growthObservationDays;
  const hasEnoughPoints = totalPoints >= SCORING.minEvolutionPointsForGrowth;
  const hasEnoughCompletions =
    completionCount >= SCORING.minCompletionCountForGrowth;

  if (!(hasEnoughCompletions && (hasEnoughDays || hasEnoughPoints))) {
    return { kind: 'not_ready', reason: 'threshold_not_met' };
  }

  const scores = aggregateByGyeol(input.events);
  const primary = choosePrimaryGyeol(scores, input.events);
  const secondary = chooseSecondaryGyeol(scores, primary);
  const resultForm = growthFormFor(primary);
  const variant = variantFor(secondary);

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
