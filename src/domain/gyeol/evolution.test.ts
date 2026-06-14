import { describe, expect, it } from 'vitest';
import { evaluateGrowthEvolution } from '@/domain/gyeol/evolution';
import type { GyeolScoreEvent, PetInstance, TodoCompletion } from '@/domain/gyeol/types';

const basePet: PetInstance = {
  id: 'pet-1',
  userId: 'user-1',
  speciesId: 'som_mong',
  name: null,
  lifeStage: 'baby',
  primaryGyeol: null,
  secondaryGyeol: null,
  affection: 0,
  startedAt: '2026-06-01T00:00:00.000Z',
  archivedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function makeEvent(
  gyeolType: GyeolScoreEvent['gyeolType'],
  points: number,
  reason = 'normal_completion',
): GyeolScoreEvent {
  return {
    id: `evt-${gyeolType}-${points}`,
    userId: 'user-1',
    petInstanceId: 'pet-1',
    todoId: 'todo-1',
    gyeolType,
    rewardType: 'small_evolution',
    points,
    reason,
    occurredAt: '2026-06-10T00:00:00.000Z',
  };
}

function makeCompletions(count: number): TodoCompletion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `comp-${i}`,
    todoId: `todo-${i}`,
    userId: 'user-1',
    completedAt: '2026-06-10T00:00:00.000Z',
    rewardType: 'small_evolution' as const,
    gyeolType: 'create' as const,
    gyeolPoints: 3,
    reason: 'normal_completion',
  }));
}

describe('evaluateGrowthEvolution', () => {
  it('returns not_ready when thresholds are not met', () => {
    const result = evaluateGrowthEvolution({
      pet: basePet,
      events: [makeEvent('focus', 3)],
      completions: makeCompletions(2),
      existingEvolutionCount: 0,
      now: new Date('2026-06-03T00:00:00.000Z'),
    });
    expect(result.kind).toBe('not_ready');
  });

  it('evolves early with enough points and completions', () => {
    const events = Array.from({ length: 7 }, (_, i) =>
      makeEvent('create', 3, i % 2 === 0 ? 'core_seed' : 'normal_completion'),
    );
    const result = evaluateGrowthEvolution({
      pet: basePet,
      events,
      completions: makeCompletions(5),
      existingEvolutionCount: 0,
      now: new Date('2026-06-03T00:00:00.000Z'),
    });
    expect(result.kind).toBe('evolve');
    if (result.kind === 'evolve') {
      expect(result.resultForm).toBe('maker_som');
      expect(result.primaryGyeol).toBe('create');
    }
  });

  it('prevents duplicate evolution', () => {
    const result = evaluateGrowthEvolution({
      pet: basePet,
      events: [makeEvent('create', 25)],
      completions: makeCompletions(5),
      existingEvolutionCount: 1,
      now: new Date('2026-06-14T00:00:00.000Z'),
    });
    expect(result).toEqual({ kind: 'not_ready', reason: 'already_evolved' });
  });

  it('prefers core seed gyeol on tie', () => {
    const events = [
      makeEvent('focus', 10, 'core_seed'),
      makeEvent('create', 10, 'normal_completion'),
    ];
    const result = evaluateGrowthEvolution({
      pet: basePet,
      events,
      completions: makeCompletions(5),
      existingEvolutionCount: 0,
      now: new Date('2026-06-14T00:00:00.000Z'),
    });
    expect(result.kind).toBe('evolve');
    if (result.kind === 'evolve') {
      expect(result.primaryGyeol).toBe('focus');
    }
  });
});
