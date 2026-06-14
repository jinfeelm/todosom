import { create } from 'zustand';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { getSetting, recordAppOpen, setSetting } from '@/db/repositories';
import { trackEvent } from '@/lib/analytics';
import { getClock } from '@/lib/clock';

interface SettingsStore {
  onboardingCompleted: boolean | null;
  notificationsEnabled: boolean | null;
  isHydrated: boolean;
  previousLastOpenAt: string | null;
  hydrate: (db: TodoSomDatabase) => Promise<void>;
  recordAppSessionOpen: (db: TodoSomDatabase) => Promise<void>;
  completeOnboarding: (db: TodoSomDatabase) => Promise<void>;
  setNotificationsEnabled: (db: TodoSomDatabase, enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  onboardingCompleted: null,
  notificationsEnabled: null,
  isHydrated: false,
  previousLastOpenAt: null,

  hydrate: async (db) => {
    const onboarding = await getSetting(db, 'onboarding_completed');
    const notifications = await getSetting(db, 'notifications_enabled');
    set({
      onboardingCompleted: onboarding === 'true',
      notificationsEnabled: notifications !== 'false',
      isHydrated: true,
    });
    trackEvent('app_opened', {
      opened_at: getClock().now().toISOString(),
      has_completed_onboarding: onboarding === 'true',
    });
  },

  recordAppSessionOpen: async (db) => {
    const { previousLastOpenAt } = await recordAppOpen(db);
    set({ previousLastOpenAt });
  },

  completeOnboarding: async (db) => {
    await setSetting(db, 'onboarding_completed', 'true');
    set({ onboardingCompleted: true });
    trackEvent('onboarding_completed', {});
  },

  setNotificationsEnabled: async (db, enabled) => {
    await setSetting(db, 'notifications_enabled', enabled ? 'true' : 'false');
    set({ notificationsEnabled: enabled });
    trackEvent('notifications_toggled', { enabled });
  },
}));
