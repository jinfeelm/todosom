import type { GyeolType, LifeStage, PetInstance } from '@/domain/gyeol/types';

export function canHatch(pet: PetInstance): boolean {
  return pet.lifeStage === 'egg';
}

export function hatchLifeStage(): LifeStage {
  return 'baby';
}

export function canStartNewJourney(pet: PetInstance): boolean {
  return pet.lifeStage === 'growth' || pet.lifeStage === 'mature';
}

export function archiveLifeStage(): LifeStage {
  return 'archived';
}

export function newJourneyLifeStage(): LifeStage {
  return 'egg';
}

export function applyHatch(pet: PetInstance, nowIso: string): PetInstance {
  return {
    ...pet,
    lifeStage: 'baby',
    updatedAt: nowIso,
  };
}

export function applyEvolution(
  pet: PetInstance,
  primaryGyeol: GyeolType,
  secondaryGyeol: GyeolType | null,
  nowIso: string,
): PetInstance {
  return {
    ...pet,
    lifeStage: 'growth',
    primaryGyeol,
    secondaryGyeol,
    updatedAt: nowIso,
  };
}

export function applyArchive(pet: PetInstance, nowIso: string): PetInstance {
  return {
    ...pet,
    lifeStage: 'archived',
    archivedAt: nowIso,
    updatedAt: nowIso,
  };
}
