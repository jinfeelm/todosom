import somMongManifest from '@/assets/pets/som_mong/manifest.json';
import lensSomManifest from '@/assets/pets/growth/lens_som/manifest.json';
import makerSomManifest from '@/assets/pets/growth/maker_som/manifest.json';
import noteSomManifest from '@/assets/pets/growth/note_som/manifest.json';
import sparkSomManifest from '@/assets/pets/growth/spark_som/manifest.json';
import breathSomManifest from '@/assets/pets/growth/breath_som/manifest.json';
import ringSomManifest from '@/assets/pets/growth/ring_som/manifest.json';
import cubeSomManifest from '@/assets/pets/growth/cube_som/manifest.json';

export type PetAnimationState =
  | 'idle'
  | 'happy'
  | 'talk'
  | 'eat'
  | 'sleep'
  | 'evolve'
  | 'egg_idle'
  | 'egg_hatch';

export interface SpriteStateConfig {
  image: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
}

export interface PetManifest {
  assetKey: string;
  displayName: string;
  baseSize: { width: number; height: number };
  displayScale?: number;
  states: Record<string, SpriteStateConfig>;
}

const SOM_MONG_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/som_mong/idle.png'),
  'happy.png': require('@/assets/pets/som_mong/happy.png'),
  'talk.png': require('@/assets/pets/som_mong/talk.png'),
  'eat.png': require('@/assets/pets/som_mong/eat.png'),
  'sleep.png': require('@/assets/pets/som_mong/sleep.png'),
  'evolve.png': require('@/assets/pets/som_mong/evolve.png'),
  'egg_idle.png': require('@/assets/pets/som_mong/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/som_mong/egg_hatch.png'),
};

const LENS_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/lens_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/lens_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/lens_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/lens_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/lens_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/lens_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/lens_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/lens_som/egg_hatch.png'),
};

const MAKER_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/maker_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/maker_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/maker_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/maker_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/maker_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/maker_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/maker_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/maker_som/egg_hatch.png'),
};

const NOTE_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/note_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/note_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/note_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/note_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/note_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/note_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/note_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/note_som/egg_hatch.png'),
};

const SPARK_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/spark_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/spark_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/spark_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/spark_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/spark_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/spark_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/spark_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/spark_som/egg_hatch.png'),
};

const BREATH_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/breath_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/breath_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/breath_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/breath_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/breath_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/breath_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/breath_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/breath_som/egg_hatch.png'),
};

const RING_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/ring_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/ring_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/ring_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/ring_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/ring_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/ring_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/ring_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/ring_som/egg_hatch.png'),
};

const CUBE_SOM_IMAGES: Record<string, number> = {
  'idle.png': require('@/assets/pets/growth/cube_som/idle.png'),
  'happy.png': require('@/assets/pets/growth/cube_som/happy.png'),
  'talk.png': require('@/assets/pets/growth/cube_som/talk.png'),
  'eat.png': require('@/assets/pets/growth/cube_som/eat.png'),
  'sleep.png': require('@/assets/pets/growth/cube_som/sleep.png'),
  'evolve.png': require('@/assets/pets/growth/cube_som/evolve.png'),
  'egg_idle.png': require('@/assets/pets/growth/cube_som/egg_idle.png'),
  'egg_hatch.png': require('@/assets/pets/growth/cube_som/egg_hatch.png'),
};

const PET_REGISTRY: Record<
  string,
  { manifest: PetManifest; images: Record<string, number> }
> = {
  som_mong: { manifest: somMongManifest as PetManifest, images: SOM_MONG_IMAGES },
  lens_som: { manifest: lensSomManifest as PetManifest, images: LENS_SOM_IMAGES },
  maker_som: { manifest: makerSomManifest as PetManifest, images: MAKER_SOM_IMAGES },
  note_som: { manifest: noteSomManifest as PetManifest, images: NOTE_SOM_IMAGES },
  spark_som: { manifest: sparkSomManifest as PetManifest, images: SPARK_SOM_IMAGES },
  breath_som: { manifest: breathSomManifest as PetManifest, images: BREATH_SOM_IMAGES },
  ring_som: { manifest: ringSomManifest as PetManifest, images: RING_SOM_IMAGES },
  cube_som: { manifest: cubeSomManifest as PetManifest, images: CUBE_SOM_IMAGES },
};

export function getPetManifest(assetKey: string): PetManifest {
  const entry = PET_REGISTRY[assetKey] ?? PET_REGISTRY.som_mong;
  return entry.manifest;
}

export function resolvePetImage(manifest: PetManifest, imageName: string): number {
  const entry = PET_REGISTRY[manifest.assetKey] ?? PET_REGISTRY.som_mong;
  return entry.images[imageName] ?? entry.images['idle.png'];
}

export function resolveAnimationState(
  lifeStage: string,
  state: PetAnimationState,
): PetAnimationState {
  if (lifeStage === 'egg') {
    return state === 'egg_hatch' ? 'egg_hatch' : 'egg_idle';
  }
  return state;
}

export function getPixelPerfectScale(nativeSize: number, targetSize: number): number {
  const scale = Math.floor(targetSize / nativeSize);
  return Math.max(1, scale);
}
