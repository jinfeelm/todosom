import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeScreen } from '@/components/common/SafeScreen';
import type { Category } from '@/domain/gyeol/types';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import {
  deleteCategory,
  LastCategoryError,
  listCategories,
  resetAllAppData,
} from '@/db/repositories';
import { trackEvent } from '@/lib/analytics';
import {
  cancelCoreSeedReminder,
  scheduleCoreSeedReminder,
} from '@/lib/notifications';
import { copy } from '@/lib/copy';
import { DatabaseGate } from '@/stores/dbContext';
import { resetClientStores } from '@/stores/resetClientStores';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

function SettingsContent({ db }: { db: TodoSomDatabase }) {
  const router = useRouter();
  const { notificationsEnabled, setNotificationsEnabled, hydrate } = useSettingsStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [resetting, setResetting] = useState(false);

  const refresh = useCallback(() => {
    void listCategories(db).then(setCategories);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void hydrate(db);
      refresh();
      trackEvent('settings_viewed', { source_tab: 'settings' });
    }, [db, hydrate, refresh]),
  );

  const handleNotificationsToggle = async (enabled: boolean) => {
    await setNotificationsEnabled(db, enabled);
    if (enabled) {
      await scheduleCoreSeedReminder(db);
    } else {
      await cancelCoreSeedReminder();
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      copy.settings.deleteCategory,
      copy.settings.deleteCategoryConfirm(category.name),
      [
        { text: copy.common.cancel, style: 'cancel' },
        {
          text: copy.common.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCategory(db, category.id);
                refresh();
              } catch (error) {
                if (error instanceof LastCategoryError) {
                  Alert.alert(copy.settings.categories, copy.settings.lastCategory);
                }
              }
            })();
          },
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(copy.settings.resetData, copy.settings.resetConfirm, [
      { text: copy.common.cancel, style: 'cancel' },
      {
        text: copy.common.confirm,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setResetting(true);
            try {
              await cancelCoreSeedReminder();
              await resetAllAppData(db);
              resetClientStores();
              await hydrate(db);
              router.replace('/onboarding');
            } catch {
              Alert.alert(copy.settings.resetData, copy.db.errorDefault);
            } finally {
              setResetting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{copy.settings.title}</Text>
        <Text style={styles.subtitle}>{copy.settings.subtitle}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{copy.settings.notifications}</Text>
              <Text style={styles.rowHint}>{copy.settings.notificationsHint}</Text>
            </View>
            <Switch
              value={notificationsEnabled ?? true}
              onValueChange={(v) => void handleNotificationsToggle(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.settings.categories}</Text>
          <Text style={styles.sectionHint}>{copy.settings.categoriesHint}</Text>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View
                  style={[styles.gyeolDot, { backgroundColor: colors.gyeol[category.gyeolType] }]}
                />
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryGyeol}>{GYEOL_LABELS[category.gyeolType]}</Text>
                </View>
              </View>
              {categories.length > 1 ? (
                <Pressable
                  style={styles.deleteChip}
                  onPress={() => handleDeleteCategory(category)}
                >
                  <Text style={styles.deleteChipText}>{copy.settings.deleteCategory}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.settings.resetData}</Text>
          <Text style={styles.sectionHint}>{copy.settings.resetHint}</Text>
          <Pressable
            style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
            onPress={handleReset}
            disabled={resetting}
          >
            <Text style={styles.resetButtonText}>{copy.settings.resetData}</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>{copy.settings.version}</Text>
      </ScrollView>
    </SafeScreen>
  );
}

export default function SettingsScreen() {
  return <DatabaseGate>{(db) => <SettingsContent db={db} />}</DatabaseGate>;
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    ...typography.label,
    color: colors.text,
  },
  rowHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gyeolDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  categoryGyeol: {
    ...typography.caption,
    color: colors.textMuted,
  },
  deleteChip: {
    minHeight: touchTarget - 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteChipText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  resetButton: {
    minHeight: touchTarget,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    ...typography.label,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
