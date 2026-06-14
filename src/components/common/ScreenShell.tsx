import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

interface ScreenShellProps {
  title?: string;
  subtitle?: string;
  state: 'loading' | 'empty' | 'ready' | 'error';
  emptyTitle?: string;
  emptyMessage?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export function ScreenShell({
  title,
  subtitle,
  state,
  emptyTitle,
  emptyMessage,
  errorMessage,
  onRetry,
  children,
}: ScreenShellProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {state === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <LoadingSkeleton />
        </View>
      ) : null}
      {state === 'empty' ? (
        <View style={styles.center}>
          {emptyTitle ? <Text style={styles.emptyTitle}>{emptyTitle}</Text> : null}
          {emptyMessage ? <Text style={styles.emptyMessage}>{emptyMessage}</Text> : null}
        </View>
      ) : null}
      {state === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          {onRetry ? (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>{copy.common.retry}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {state === 'ready' ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    ...typography.label,
    color: '#fff',
  },
  skeletonWrap: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    width: '70%',
    alignSelf: 'center',
  },
  skeletonLineShort: {
    width: '40%',
  },
  skeletonCard: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.sm,
  },
});
