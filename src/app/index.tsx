import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { rolloverOpenTodosToMist } from '@/db/repositories';
import { DatabaseGate } from '@/stores/dbContext';
import { useSettingsStore } from '@/stores/settingsStore';
import { scheduleCoreSeedReminder } from '@/lib/notifications';
import { colors } from '@/theme';
import type { TodoSomDatabase } from '@/db/databaseTypes';

function IndexContent({ db }: { db: TodoSomDatabase }) {
  const { onboardingCompleted, isHydrated, hydrate, recordAppSessionOpen } = useSettingsStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await hydrate(db);
      await rolloverOpenTodosToMist(db);
      if (cancelled) {
        return;
      }
      await recordAppSessionOpen(db);
      if (cancelled) {
        return;
      }
      if (useSettingsStore.getState().onboardingCompleted) {
        const notificationsOn = useSettingsStore.getState().notificationsEnabled;
        if (notificationsOn !== false) {
          await scheduleCoreSeedReminder(db);
        }
      }
      if (cancelled) {
        return;
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [db, hydrate, recordAppSessionOpen]);

  if (!ready || !isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/today" />;
}

export default function IndexScreen() {
  return <DatabaseGate>{(db) => <IndexContent db={db} />}</DatabaseGate>;
}

const styles = {
  center: {
    flex: 1 as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
  },
};
