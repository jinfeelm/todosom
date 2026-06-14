import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import {
  getPetManifest,
  getPixelPerfectScale,
  resolveAnimationState,
  resolvePetImage,
  type PetAnimationState,
} from '@/lib/petManifest';

interface AnimatedSpriteProps {
  assetKey: string;
  lifeStage: string;
  state?: PetAnimationState;
  size?: number;
  onAnimationEnd?: () => void;
}

export function AnimatedSprite({
  assetKey,
  lifeStage,
  state = 'idle',
  size = 256,
  onAnimationEnd,
}: AnimatedSpriteProps) {
  const manifest = useMemo(() => getPetManifest(assetKey), [assetKey]);
  const animationState = resolveAnimationState(lifeStage, state);
  const stateConfig = manifest.states[animationState] ?? manifest.states.idle;
  const displayScale = manifest.displayScale ?? 1;
  const nativeFrameWidth = stateConfig.frameWidth * displayScale;
  const nativeFrameHeight = stateConfig.frameHeight * displayScale;
  const pixelScale = getPixelPerfectScale(nativeFrameHeight, size);
  const renderedWidth = nativeFrameWidth * pixelScale;
  const renderedHeight = nativeFrameHeight * pixelScale;

  const [frameIndex, setFrameIndex] = useState(0);
  const source = resolvePetImage(manifest, stateConfig.image);

  useEffect(() => {
    setFrameIndex(0);
  }, [animationState, assetKey, lifeStage, stateConfig.frameCount]);

  useEffect(() => {
    const intervalMs = 1000 / stateConfig.fps;
    let frame = 0;
    const timer = setInterval(() => {
      frame += 1;
      if (frame >= stateConfig.frameCount) {
        if (stateConfig.loop) {
          frame = 0;
        } else {
          clearInterval(timer);
          onAnimationEnd?.();
          setFrameIndex(stateConfig.frameCount - 1);
          return;
        }
      }
      setFrameIndex(frame);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [animationState, stateConfig, onAnimationEnd]);

  const imageStyle = useMemo(
    () => ({
      width: renderedWidth * stateConfig.frameCount,
      height: renderedHeight,
      transform: [{ translateX: -frameIndex * renderedWidth }],
      ...(Platform.OS === 'web'
        ? ({ imageRendering: 'pixelated' } as Record<string, string>)
        : null),
    }),
    [frameIndex, renderedHeight, renderedWidth, stateConfig.frameCount],
  );

  return (
    <View style={[styles.clip, { width: renderedWidth, height: renderedHeight }]}>
      <Image source={source} style={imageStyle} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
