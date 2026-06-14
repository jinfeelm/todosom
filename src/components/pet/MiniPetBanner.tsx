import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PetSprite } from '@/components/pet/PetSprite';
import type { PetAnimationState } from '@/lib/petManifest';
import { colors, radius, spacing, typography } from '@/theme';

interface MiniPetBannerProps {
  assetKey: string;
  lifeStage: string;
  message: string;
  petState?: PetAnimationState;
  size?: number;
  onPress?: () => void;
}

export function MiniPetBanner({
  assetKey,
  lifeStage,
  message,
  petState = 'idle',
  size = 64,
  onPress,
}: MiniPetBannerProps) {
  const handlePress = onPress ?? (() => router.push('/(tabs)/pet-room'));

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.petWrap}>
        <PetSprite
          assetKey={assetKey}
          lifeStage={lifeStage}
          size={size}
          state={petState}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>솜몽</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  petWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  message: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
