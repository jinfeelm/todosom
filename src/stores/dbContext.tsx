import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { openDatabase } from '@/db/localDb';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { copy } from '@/lib/copy';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

export type DbState =
  | { status: 'loading' }
  | { status: 'ready'; db: TodoSomDatabase }
  | { status: 'error'; error: string };

interface DbContextValue {
  state: DbState;
  retry: () => void;
}

const DbContext = createContext<DbContextValue>({
  state: { status: 'loading' },
  retry: () => undefined,
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DbState>({ status: 'loading' });

  const init = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const db = await openDatabase();
      setState({ status: 'ready', db });
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : copy.db.errorDefault,
      });
    }
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <DbContext.Provider value={{ state, retry: () => void init() }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDbState(): DbState {
  return useContext(DbContext).state;
}

export function useDbRetry(): () => void {
  return useContext(DbContext).retry;
}

/** DB가 준비된 경우에만 db를 반환합니다. 준비 전이면 null. */
export function useOptionalDb(): TodoSomDatabase | null {
  const state = useDbState();
  return state.status === 'ready' ? state.db : null;
}

/** DB가 준비된 화면에서만 사용하세요. */
export function useDb(): TodoSomDatabase {
  const state = useDbState();
  if (state.status !== 'ready') {
    throw new Error('Database not ready');
  }
  return state.db;
}

interface DatabaseGateProps {
  children: (db: TodoSomDatabase) => React.ReactNode;
}

/** DB 로딩/에러를 처리한 뒤 children에 db를 넘깁니다. */
export function DatabaseGate({ children }: DatabaseGateProps) {
  const state = useDbState();
  const retry = useDbRetry();

  if (state.status === 'loading') {
    return (
      <View style={gateStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={gateStyles.loadingText}>{copy.db.loading}</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={gateStyles.center}>
        <Text style={gateStyles.errorTitle}>{copy.db.errorTitle}</Text>
        <Text style={gateStyles.errorMessage}>{state.error}</Text>
        <Pressable style={gateStyles.retryButton} onPress={retry}>
          <Text style={gateStyles.retryText}>{copy.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children(state.db)}</>;
}

const gateStyles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    ...typography.label,
    color: '#fff',
  },
});
