import React from 'react';
import { AnimatedSprite } from '@/components/pet/AnimatedSprite';
import type { PetAnimationState } from '@/lib/petManifest';

interface PetSpriteProps {
  assetKey: string;
  lifeStage: string;
  size?: number;
  state?: PetAnimationState;
  onAnimationEnd?: () => void;
}

export function PetSprite({
  assetKey,
  lifeStage,
  size = 256,
  state = 'idle',
  onAnimationEnd,
}: PetSpriteProps) {
  return (
    <AnimatedSprite
      assetKey={assetKey}
      lifeStage={lifeStage}
      state={state}
      size={size}
      onAnimationEnd={onAnimationEnd}
    />
  );
}
