import type { TodoSomDatabase } from '@/db/databaseTypes';
import { getSetting } from '@/db/repositories';
import { copy } from '@/lib/copy';

const MIST_ROLLOVER_KEY = 'last_mist_rollover_date';

async function isNotificationsEnabled(db?: TodoSomDatabase): Promise<boolean> {
  if (!db) {
    return true;
  }
  const value = await getSetting(db, 'notifications_enabled');
  return value !== 'false';
}

export async function scheduleCoreSeedReminder(db?: TodoSomDatabase): Promise<void> {
  if (db && !(await isNotificationsEnabled(db))) {
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.notifications.title,
        body: copy.notifications.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch {
    // Notifications unavailable on web or without native module
  }
}

export async function cancelCoreSeedReminder(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Notifications unavailable on web or without native module
  }
}

export { MIST_ROLLOVER_KEY };
