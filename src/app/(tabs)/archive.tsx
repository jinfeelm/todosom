import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WeeklySummary } from '@/components/archive/WeeklySummary';
import { ScreenShell } from '@/components/common/ScreenShell';
import { GROWTH_DISPLAY_NAMES } from '@/domain/gyeol/constants';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { canStartNewJourney } from '@/domain/pet/lifecycle';
import {
  aggregateWeeklyGyeolScores,
  buildPetRoomView,
  getCurrentPet,
} from '@/db/repositories';
import type { GyeolType } from '@/domain/gyeol/types';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { copy, formatLifeStage } from '@/lib/copy';
import { DatabaseGate } from '@/stores/dbContext';
import { usePetStore } from '@/stores/petStore';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

function ArchiveContent({ db }: { db: TodoSomDatabase }) {
  const {
    screenState,
    archivedPets,
    evolutionHistory,
    errorMessage,
    loadArchive,
    startNewJourney,
    loadEvolutionHistory,
  } = usePetStore();
  const [currentJourney, setCurrentJourney] = useState<{
    name: string;
    stage: string;
    form: string | null;
  } | null>(null);
  const [weeklyScores, setWeeklyScores] = useState<Record<GyeolType, number>>({
    focus: 0,
    create: 0,
    learn: 0,
    breakthrough: 0,
    care: 0,
    connect: 0,
    organize: 0,
  });
  const [weeklyTotal, setWeeklyTotal] = useState(0);

  const refresh = useCallback(async () => {
    await loadArchive(db);
    const weekly = await aggregateWeeklyGyeolScores(db);
    setWeeklyScores(weekly.scores);
    setWeeklyTotal(weekly.totalPoints);
    try {
      const pet = await getCurrentPet(db);
      const view = await buildPetRoomView(db);
      setCurrentJourney({
        name: view.species.name,
        stage: pet.lifeStage,
        form: view.resultForm,
      });
      await loadEvolutionHistory(db, pet.id);
    } catch {
      setCurrentJourney(null);
    }
  }, [db, loadArchive, loadEvolutionHistory]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleNewJourney = async () => {
    const pet = await getCurrentPet(db);
    if (!canStartNewJourney(pet)) {
      Alert.alert(copy.archive.newJourney, copy.archive.newJourneyBlocked);
      return;
    }

    Alert.alert(copy.archive.newJourney, copy.archive.newJourneyConfirm, [
      { text: copy.common.cancel, style: 'cancel' },
      {
        text: copy.archive.newJourney,
        onPress: () => {
          void (async () => {
            const ok = await startNewJourney(db);
            if (ok) {
              await refresh();
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScreenShell
      title={copy.archive.title}
      subtitle={copy.archive.subtitle}
      state={screenState}
      emptyTitle={copy.archive.emptyTitle}
      emptyMessage={copy.archive.emptyMessage}
      errorMessage={errorMessage}
      onRetry={() => void refresh()}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <WeeklySummary scores={weeklyScores} totalPoints={weeklyTotal} />

        {currentJourney ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{copy.archive.currentJourney}</Text>
            <Text style={styles.cardTitle}>{currentJourney.name}</Text>
            <Text style={styles.cardMeta}>
              {formatLifeStage(currentJourney.stage)}
              {currentJourney.form
                ? ` · ${GROWTH_DISPLAY_NAMES[currentJourney.form] ?? currentJourney.form}`
                : ''}
            </Text>
            {currentJourney.stage === 'growth' || currentJourney.stage === 'mature' ? (
              <Pressable style={styles.cta} onPress={() => void handleNewJourney()}>
                <Text style={styles.ctaText}>{copy.archive.newJourneyFree}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {evolutionHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.archive.evolutionHistory}</Text>
            {evolutionHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyTitle}>
                  {GROWTH_DISPLAY_NAMES[item.resultForm] ?? item.resultForm}
                </Text>
                <Text style={styles.historyMeta}>
                  {GYEOL_LABELS[item.primaryGyeol]}
                  {item.secondaryGyeol ? ` + ${GYEOL_LABELS[item.secondaryGyeol]}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {archivedPets.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.archive.pastJourneys}</Text>
            {archivedPets.map((pet) => (
              <View key={pet.petInstanceId} style={styles.card}>
                <Text style={styles.cardTitle}>{pet.displayName}</Text>
                <Text style={styles.cardMeta}>
                  {pet.resultForm
                    ? GROWTH_DISPLAY_NAMES[pet.resultForm] ?? pet.resultForm
                    : formatLifeStage(pet.lifeStage)}
                  {pet.primaryGyeol ? ` · ${GYEOL_LABELS[pet.primaryGyeol]}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

export default function ArchiveScreen() {
  return <DatabaseGate>{(db) => <ArchiveContent db={db} />}</DatabaseGate>;
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.label,
    color: colors.primary,
  },
  historyItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyTitle: {
    ...typography.body,
    color: colors.text,
  },
  historyMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
