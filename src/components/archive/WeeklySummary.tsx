import { StyleSheet, Text, View } from 'react-native';
import type { GyeolType } from '@/domain/gyeol/types';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, typography } from '@/theme';

interface WeeklySummaryProps {
  scores: Record<GyeolType, number>;
  totalPoints: number;
}

export function WeeklySummary({ scores, totalPoints }: WeeklySummaryProps) {
  const active = Object.entries(scores).filter(([, v]) => v > 0);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{copy.archive.weeklyTitle}</Text>
      {active.length === 0 ? (
        <Text style={styles.empty}>{copy.archive.weeklyEmpty}</Text>
      ) : (
        <>
          <Text style={styles.total}>총 {totalPoints}점</Text>
          <View style={styles.row}>
            {active.map(([type, points]) => (
              <View key={type} style={styles.chip}>
                <View
                  style={[styles.dot, { backgroundColor: colors.gyeol[type as GyeolType] }]}
                />
                <Text style={styles.chipText}>
                  {GYEOL_LABELS[type as GyeolType]} +{points}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  total: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
