import { SCORING } from '@/domain/gyeol/constants';
import { evaluateGrowthEvolution, sumEvolutionPoints } from '@/domain/gyeol/evolution';
import type { GyeolScoreEvent, LifeStage, PetInstance, TodoCompletion } from '@/domain/gyeol/types';
import { diffDays } from '@/lib/clock';

export interface EvolutionProgressView {
  lifeStage: LifeStage;
  completionCount: number;
  totalPoints: number;
  daysSinceStart: number;
  minCompletions: number;
  minPoints: number;
  minDays: number;
  canEvolve: boolean;
  alreadyEvolved: boolean;
  completionRatio: number;
  pointsRatio: number;
  daysRatio: number;
  overallRatio: number;
}

export interface BuildEvolutionProgressInput {
  pet: PetInstance;
  events: GyeolScoreEvent[];
  completions: TodoCompletion[];
  existingEvolutionCount: number;
  now: Date;
}

function clampRatio(value: number, target: number): number {
  if (target <= 0) {
    return 1;
  }
  return Math.min(1, value / target);
}

export function buildEvolutionProgress(
  input: BuildEvolutionProgressInput,
): EvolutionProgressView {
  const totalPoints = sumEvolutionPoints(input.events);
  const completionCount = input.completions.length;
  const daysSinceStart = diffDays(input.pet.startedAt, input.now);
  const alreadyEvolved = input.existingEvolutionCount > 0;

  const completionRatio = clampRatio(completionCount, SCORING.minCompletionCountForGrowth);
  const pointsRatio = clampRatio(totalPoints, SCORING.minEvolutionPointsForGrowth);
  const daysRatio = clampRatio(daysSinceStart, SCORING.growthObservationDays);

  const decision = evaluateGrowthEvolution(input);
  const canEvolve = decision.kind === 'evolve';

  const overallRatio = canEvolve
    ? 1
    : Math.max(completionRatio, Math.min(pointsRatio, daysRatio));

  return {
    lifeStage: input.pet.lifeStage,
    completionCount,
    totalPoints,
    daysSinceStart,
    minCompletions: SCORING.minCompletionCountForGrowth,
    minPoints: SCORING.minEvolutionPointsForGrowth,
    minDays: SCORING.growthObservationDays,
    canEvolve,
    alreadyEvolved,
    completionRatio,
    pointsRatio,
    daysRatio,
    overallRatio,
  };
}
