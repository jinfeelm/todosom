import { describe, expect, it } from 'vitest';
import { buildEvolutionProgress } from '@/domain/gyeol/evolutionProgress';
import type { PetInstance } from '@/domain/gyeol/types';

const basePet: PetInstance = {
  id: 'pet-1',
  userId: 'user-1',
  speciesId: 'som_mong',
  name: null,
  lifeStage: 'baby',
  primaryGyeol: null,
  secondaryGyeol: null,
  affection: 0,
  startedAt: '2026-06-07T12:00:00.000Z',
  archivedAt: null,
  createdAt: '2026-06-07T12:00:00.000Z',
  updatedAt: '2026-06-07T12:00:00.000Z',
};

describe('buildEvolutionProgress', () => {
  it('reports ready when thresholds are met', () => {
    const progress = buildEvolutionProgress({
      pet: basePet,
      events: [
        {
          id: 'e1',
          userId: 'user-1',
          petInstanceId: 'pet-1',
          todoId: 't1',
          gyeolType: 'focus',
          rewardType: 'small_evolution',
          points: 21,
          reason: 'normal_completion',
          occurredAt: '2026-06-14T12:00:00.000Z',
        },
      ],
      completions: Array.from({ length: 5 }, (_, i) => ({
        id: `c${i}`,
        todoId: `t${i}`,
        userId: 'user-1',
        completedAt: '2026-06-14T12:00:00.000Z',
        rewardType: 'small_evolution' as const,
        gyeolType: 'focus' as const,
        gyeolPoints: 3,
        reason: 'normal_completion',
      })),
      existingEvolutionCount: 0,
      now: new Date('2026-06-14T12:00:00.000Z'),
    });

    expect(progress.canEvolve).toBe(true);
    expect(progress.overallRatio).toBe(1);
  });
});
