import { describe, expect, it } from 'vitest';
import {
  applyArchive,
  applyEvolution,
  applyHatch,
  canHatch,
  canStartNewJourney,
} from '@/domain/pet/lifecycle';
import type { PetInstance } from '@/domain/gyeol/types';

const basePet: PetInstance = {
  id: 'pet-1',
  userId: 'user-1',
  speciesId: 'som_mong',
  name: null,
  lifeStage: 'egg',
  primaryGyeol: null,
  secondaryGyeol: null,
  affection: 0,
  startedAt: '2026-06-01T00:00:00.000Z',
  archivedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('lifecycle', () => {
  it('hatches egg to baby', () => {
    expect(canHatch(basePet)).toBe(true);
    const hatched = applyHatch(basePet, '2026-06-14T00:00:00.000Z');
    expect(hatched.lifeStage).toBe('baby');
  });

  it('evolves baby to growth', () => {
    const baby = applyHatch(basePet, '2026-06-14T00:00:00.000Z');
    const evolved = applyEvolution(baby, 'create', 'focus', '2026-06-20T00:00:00.000Z');
    expect(evolved.lifeStage).toBe('growth');
    expect(evolved.primaryGyeol).toBe('create');
  });

  it('allows new journey only after growth', () => {
    const baby = applyHatch(basePet, '2026-06-14T00:00:00.000Z');
    expect(canStartNewJourney(baby)).toBe(false);
    const growth = applyEvolution(baby, 'learn', null, '2026-06-20T00:00:00.000Z');
    expect(canStartNewJourney(growth)).toBe(true);
  });

  it('archives pet', () => {
    const growth = applyEvolution(
      applyHatch(basePet, '2026-06-14T00:00:00.000Z'),
      'care',
      null,
      '2026-06-20T00:00:00.000Z',
    );
    const archived = applyArchive(growth, '2026-06-25T00:00:00.000Z');
    expect(archived.lifeStage).toBe('archived');
    expect(archived.archivedAt).toBeTruthy();
  });
});
