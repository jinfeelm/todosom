import { SCORING } from '@/domain/gyeol/constants';
import type { Category, Difficulty, RewardType, Todo } from '@/domain/gyeol/types';

export interface ScoreTodoCompletionInput {
  todo: Todo;
  category: Category;
  completedAt: Date;
  sameCategoryCompletionCountToday: number;
  currentDailyEvolutionPoints: number;
}

export interface ScoreTodoCompletionResult {
  rewardType: RewardType;
  gyeolType: Category['gyeolType'];
  points: number;
  reason: string;
}

function difficultyPoints(difficulty: Difficulty): number {
  return SCORING.difficultyPoints[difficulty];
}

function wasCreatedAndCompletedTooFast(todo: Todo, completedAt: Date): boolean {
  const created = new Date(todo.createdAt).getTime();
  return completedAt.getTime() - created < SCORING.instantCompletionThresholdMs;
}

function wasPlannedAhead(todo: Todo): boolean {
  if (!todo.plannedAt) {
    return false;
  }
  const planned = new Date(todo.plannedAt);
  const created = new Date(todo.createdAt);
  return planned.getTime() < created.getTime() || planned.toDateString() !== created.toDateString();
}

function wasRescheduledFromMist(todo: Todo): boolean {
  return todo.status === 'mist';
}

function applyCategoryDiminishingReturns(
  points: number,
  sameCategoryCompletionCountToday: number,
): number {
  if (sameCategoryCompletionCountToday >= SCORING.sameCategoryDiminishingStart) {
    return Math.max(1, Math.floor(points * SCORING.sameCategoryDiminishingMultiplier));
  }
  return points;
}

function applyDailyCap(points: number, currentDailyEvolutionPoints: number): number {
  const remaining = SCORING.dailyEvolutionPointCap - currentDailyEvolutionPoints;
  if (remaining <= 0) {
    return 0;
  }
  return Math.min(points, remaining);
}

export function scoreTodoCompletion(
  input: ScoreTodoCompletionInput,
): ScoreTodoCompletionResult {
  let points = difficultyPoints(input.todo.difficulty);
  let rewardType: RewardType = 'small_evolution';
  const reasonParts: string[] = [];

  if (input.todo.isCoreSeed) {
    points += SCORING.coreSeedBonus;
    rewardType = 'deep_evolution';
    reasonParts.push('core_seed');
  }

  if (wasRescheduledFromMist(input.todo)) {
    points += SCORING.recoveryBonus;
    rewardType = 'recovery';
    reasonParts.push('recovery');
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
