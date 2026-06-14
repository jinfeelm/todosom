import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '@/components/common/ScreenShell';
import { EvolutionModal } from '@/components/pet/EvolutionModal';
import { EvolutionProgressCard } from '@/components/pet/EvolutionProgressCard';
import { PetRoom } from '@/components/pet/PetRoom';
import { evaluateAndApplyEvolution } from '@/db/repositories';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { useLayout } from '@/hooks/useLayout';
import { copy, formatPetRoomSubtitle } from '@/lib/copy';
import type { PetAnimationState } from '@/lib/petManifest';
import { DatabaseGate } from '@/stores/dbContext';
import { usePetStore } from '@/stores/petStore';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

function PetRoomContent({ db }: { db: TodoSomDatabase }) {
  const { petSize } = useLayout();
  const {
    screenState,
    petRoom,
    talkDialogue,
    talkAnimationState,
    showEvolutionModal,
    errorMessage,
    loadPetRoom,
    talk,
    dismissEvolutionModal,
    showEvolution,
  } = usePetStore();
  const [checkingEvolution, setCheckingEvolution] = useState(false);
  const [petAnim, setPetAnim] = useState<PetAnimationState | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      void loadPetRoom(db);
      setPetAnim(undefined);
    }, [db, loadPetRoom]),
  );

  const handleTalk = async () => {
    await talk(db);
    const anim = usePetStore.getState().talkAnimationState ?? 'talk';
    setPetAnim(anim);
    setTimeout(() => setPetAnim(undefined), 2400);
  };

  const handleCheckEvolution = async () => {
    setCheckingEvolution(true);
    setPetAnim('evolve');
    const evolution = await evaluateAndApplyEvolution(db);
    if (evolution) {
      showEvolution();
      await loadPetRoom(db);
    }
    setCheckingEvolution(false);
    setPetAnim(undefined);
  };

  const defaultAnim = petRoom?.dialogueAnimationState;

  return (
    <View style={styles.root}>
      <ScreenShell
        title={copy.petRoom.title}
        subtitle={
          petRoom
            ? formatPetRoomSubtitle(petRoom.species.name, petRoom.pet.lifeStage)
            : undefined
        }
        state={screenState}
        errorMessage={errorMessage}
        onRetry={() => void loadPetRoom(db)}
      >
        {petRoom ? (
          <>
            <EvolutionProgressCard db={db} />
            <PetRoom
              assetKey={petRoom.assetKey}
              lifeStage={petRoom.pet.lifeStage}
              dialogue={talkDialogue ?? petRoom.currentDialogue}
              todayScores={petRoom.todayScores}
              petState={petAnim ?? defaultAnim}
              petSize={petSize}
            />
            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={() => void handleTalk()}>
                <Text style={styles.actionText}>{copy.petRoom.talk}</Text>
              </Pressable>
              {petRoom.canEvolve ? (
                <Pressable
                  style={[styles.actionButton, styles.evolveButton]}
                  onPress={() => void handleCheckEvolution()}
                  disabled={checkingEvolution}
                >
                  <Text style={[styles.actionText, styles.evolveButtonText]}>
                    {checkingEvolution ? copy.petRoom.evolving : copy.petRoom.evolve}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}
      </ScreenShell>

      {petRoom ? (
        <EvolutionModal
          visible={showEvolutionModal}
          resultForm={petRoom.resultForm}
          primaryGyeol={petRoom.pet.primaryGyeol}
          secondaryGyeol={petRoom.pet.secondaryGyeol}
          onClose={dismissEvolutionModal}
        />
      ) : null}
    </View>
  );
}

export default function PetRoomScreen() {
  return <DatabaseGate>{(db) => <PetRoomContent db={db} />}</DatabaseGate>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    ...typography.label,
    color: colors.text,
  },
  evolveButtonText: {
    color: '#fff',
  },
});
