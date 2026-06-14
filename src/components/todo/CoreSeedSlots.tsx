import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TodayTodoView } from '@/domain/gyeol/types';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, typography } from '@/theme';

const MAX_CORE_SEEDS = 3;

interface CoreSeedSlotsProps {
  items: TodayTodoView[];
  onSlotPress: (item: TodayTodoView) => void;
  onAddPress: () => void;
}

export function CoreSeedSlots({ items, onSlotPress, onAddPress }: CoreSeedSlotsProps) {
  const slots = Array.from({ length: MAX_CORE_SEEDS }, (_, index) => items[index] ?? null);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy.coreSeed.title}</Text>
        <Text style={styles.count}>
          {items.length}/{MAX_CORE_SEEDS}
        </Text>
      </View>
      <View style={styles.row}>
        {slots.map((item, index) => (
          <Pressable
            key={item?.todo.id ?? `empty-${index}`}
            style={[styles.slot, item ? styles.slotFilled : styles.slotEmpty]}
            onPress={() => {
              if (item) {
                onSlotPress(item);
              } else {
                onAddPress();
              }
            }}
          >
            <Text style={styles.rank}>{copy.coreSeed.rank(index + 1)}</Text>
            {item ? (
              <>
                <View
                  style={[
                    styles.gyeolDot,
                    { backgroundColor: colors.gyeol[item.category.gyeolType] },
                  ]}
                />
                <Text style={styles.slotTitle} numberOfLines={2}>
                  {item.todo.title}
                </Text>
                <Text style={styles.slotMeta}>{item.gyeolLabel}</Text>
                {item.todo.status === 'completed' ? (
                  <Text style={styles.slotDone}>✓</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.plus}>+</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slot: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  slotEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  slotFilled: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.coreSeedBorder,
    position: 'relative',
  },
  rank: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  plus: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
    textAlign: 'center',
  },
  gyeolDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  slotTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 16,
  },
  slotMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  slotDone: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
});
