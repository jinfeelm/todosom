import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { getEvolutionProgress } from '@/db/repositories';
import type { EvolutionProgressView } from '@/domain/gyeol/evolutionProgress';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, typography } from '@/theme';

interface EvolutionProgressCardProps {
  db: TodoSomDatabase;
}

function ProgressBar({ ratio }: { ratio: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
    </View>
  );
}

export function EvolutionProgressCard({ db }: EvolutionProgressCardProps) {
  const [progress, setProgress] = useState<EvolutionProgressView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getEvolutionProgress(db).then((view) => {
      if (!cancelled) {
        setProgress(view);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  if (!progress) {
    return null;
  }

  if (progress.lifeStage !== 'baby' || progress.alreadyEvolved) {
    if (progress.alreadyEvolved) {
      return (
        <View style={styles.card}>
          <Text style={styles.doneText}>{copy.evolution.done}</Text>
        </View>
      );
    }
    return null;
  }

  const statusText = progress.canEvolve ? copy.evolution.ready : copy.evolution.hint;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.evolution.title}</Text>
      <Text style={styles.status}>{statusText}</Text>
      <ProgressBar ratio={progress.overallRatio} />
      <View style={styles.stats}>
        <Text style={styles.stat}>
          {copy.evolution.completions(progress.completionCount, progress.minCompletions)}
        </Text>
        <Text style={styles.stat}>
          {copy.evolution.points(progress.totalPoints, progress.minPoints)}
        </Text>
        <Text style={styles.stat}>
          {copy.evolution.days(progress.daysSinceStart, progress.minDays)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  status: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  doneText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
