import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { TodayTodoView } from '@/domain/gyeol/types';
import { copy } from '@/lib/copy';
import { useLayout } from '@/hooks/useLayout';
import { colors, radius, spacing, shadow, touchTarget, typography } from '@/theme';

interface TodoItemProps {
  item: TodayTodoView;
  onComplete: (id: string) => void;
  onToggleCoreSeed: (id: string, enabled: boolean) => void;
  onPress?: (id: string) => void;
  onDelete?: (id: string) => void;
  showCoreSeedToggle?: boolean;
}

export function TodoItem({
  item,
  onComplete,
  onToggleCoreSeed,
  onPress,
  onDelete,
  showCoreSeedToggle = true,
}: TodoItemProps) {
  const { todo, category, gyeolLabel, canMarkCoreSeed } = item;
  const isCompleted = todo.status === 'completed';
  const swipeRef = useRef<Swipeable>(null);

  const handleComplete = () => {
    if (isCompleted) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeRef.current?.close();
    onComplete(todo.id);
  };

  const handleDelete = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeRef.current?.close();
    onDelete?.(todo.id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });
    return (
      <Pressable style={styles.swipeAction} onPress={handleComplete}>
        <Animated.Text style={[styles.swipeActionText, { transform: [{ scale }] }]}>
          {copy.todoItem.swipeComplete}
        </Animated.Text>
      </Pressable>
    );
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    if (!onDelete) {
      return null;
    }
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });
    return (
      <Pressable style={styles.swipeDelete} onPress={handleDelete}>
        <Animated.Text style={[styles.swipeActionText, { transform: [{ scale }] }]}>
          {copy.todoItem.swipeDelete}
        </Animated.Text>
      </Pressable>
    );
  };

  const card = (
    <Pressable
      onPress={() => onPress?.(todo.id)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.todoItem.tapDetail}
    >
      <View style={[styles.card, todo.isCoreSeed && styles.coreCard]}>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isCompleted ? copy.todoItem.completed : copy.todoItem.complete}
            style={[styles.checkButton, isCompleted && styles.checkButtonDone]}
            onPress={handleComplete}
            disabled={isCompleted}
          >
            {isCompleted ? <Text style={styles.checkMark}>✓</Text> : null}
          </Pressable>
          <View style={styles.content}>
            <Text style={[styles.title, isCompleted && styles.titleDone]}>{todo.title}</Text>
            <View style={styles.metaRow}>
              <View
                style={[styles.gyeolDot, { backgroundColor: colors.gyeol[category.gyeolType] }]}
              />
              <Text style={styles.meta}>
                {category.name} · {gyeolLabel}
              </Text>
            </View>
          </View>
        </View>
        {showCoreSeedToggle && !isCompleted ? (
          <Pressable
            style={styles.coreToggle}
            onPress={() => onToggleCoreSeed(todo.id, !todo.isCoreSeed)}
            disabled={!canMarkCoreSeed && !todo.isCoreSeed}
          >
            <Text
              style={[
                styles.coreToggleText,
                todo.isCoreSeed && styles.coreToggleTextActive,
                !canMarkCoreSeed && !todo.isCoreSeed && styles.coreToggleDisabled,
              ]}
            >
              {todo.isCoreSeed ? copy.todoItem.coreSeedOn : copy.todoItem.coreSeedOff}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );

  if (isCompleted) {
    return card;
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={onDelete ? renderLeftActions : undefined}
      overshootRight={false}
      overshootLeft={false}
    >
      {card}
    </Swipeable>
  );
}

interface ToastProps {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const { toastBottom } = useLayout();
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(onHide, 2800);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) {
    return null;
  }

  return (
    <View style={[styles.toast, shadow.fab, { bottom: toastBottom }]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coreCard: {
    borderColor: colors.coreSeedBorder,
    backgroundColor: colors.coreSeedBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkButtonDone: {
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  gyeolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  coreToggle: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  coreToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  coreToggleTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  coreToggleDisabled: {
    opacity: 0.35,
  },
  swipeAction: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  swipeDelete: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    marginRight: spacing.xs,
  },
  swipeActionText: {
    ...typography.label,
    color: '#fff',
  },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  toastText: {
    ...typography.label,
    color: '#fff',
    textAlign: 'center',
  },
});
