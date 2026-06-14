import React, { useMemo } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { PetSprite } from '@/components/pet/PetSprite';
import type { GyeolType } from '@/domain/gyeol/types';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { getDayPeriod, getDayPeriodLabel } from '@/lib/dayPeriod';
import { getRoomBackground } from '@/lib/roomAssets';
import type { PetAnimationState } from '@/lib/petManifest';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, typography } from '@/theme';

interface PetRoomProps {
  assetKey: string;
  lifeStage: string;
  dialogue: string;
  todayScores: Record<GyeolType, number>;
  petState?: PetAnimationState;
  petSize?: number;
}

export function PetRoom({
  assetKey,
  lifeStage,
  dialogue,
  todayScores,
  petState,
  petSize = 220,
}: PetRoomProps) {
  const period = getDayPeriod();
  const periodLabel = getDayPeriodLabel(period);
  const background = getRoomBackground(period);
  const activeScores = Object.entries(todayScores).filter(([, v]) => v > 0);

  const resolvedState = useMemo((): PetAnimationState => {
    if (petState) {
      return petState;
    }
    if (lifeStage === 'egg') {
      return 'egg_idle';
    }
    return period === 'night' ? 'sleep' : 'idle';
  }, [lifeStage, period, petState]);

  return (
    <View style={styles.container}>
      <ImageBackground source={background} style={styles.room} imageStyle={styles.roomImage}>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{periodLabel}</Text>
        </View>
        <View style={styles.petLayer}>
          <PetSprite
            assetKey={assetKey}
            lifeStage={lifeStage}
            size={petSize}
            state={resolvedState}
          />
        </View>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{dialogue}</Text>
        </View>
      </ImageBackground>

      <View style={styles.scorePanel}>
        <Text style={styles.scoreTitle}>{copy.petRoom.todayGyeol}</Text>
        {activeScores.length === 0 ? (
          <Text style={styles.scoreEmpty}>{copy.petRoom.noGyeol}</Text>
        ) : (
          <View style={styles.scoreRow}>
            {activeScores.map(([type, points]) => (
              <View key={type} style={styles.scoreChip}>
                <View
                  style={[
                    styles.scoreDot,
                    { backgroundColor: colors.gyeol[type as GyeolType] },
                  ]}
                />
                <Text style={styles.scoreItem}>
                  {GYEOL_LABELS[type as GyeolType]} +{points}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  room: {
    minHeight: 300,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  roomImage: {
    resizeMode: 'cover',
  },
  periodBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  petLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    minHeight: 200,
  },
  speechBubble: {
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speechText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  scorePanel: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  scoreTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scoreEmpty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  scoreItem: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
