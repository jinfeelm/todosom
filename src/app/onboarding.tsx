import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PetSprite } from '@/components/pet/PetSprite';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { createTodo, completeTodo } from '@/db/repositories';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import type { PetAnimationState } from '@/lib/petManifest';
import { copy } from '@/lib/copy';
import { useLayout } from '@/hooks/useLayout';
import { DatabaseGate } from '@/stores/dbContext';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePetStore } from '@/stores/petStore';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';
import { trackEvent } from '@/lib/analytics';
import { scheduleCoreSeedReminder } from '@/lib/notifications';

type OnboardingStep = 'welcome' | 'plant' | 'hatch';

function OnboardingContent({ db }: { db: TodoSomDatabase }) {
  const { insets, petSize } = useLayout();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const loadPetRoom = usePetStore((s) => s.loadPetRoom);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [title, setTitle] = useState('');
  const [todoId, setTodoId] = useState<string | null>(null);
  const [gyeolMessage, setGyeolMessage] = useState('');
  const [petAnim, setPetAnim] = useState<PetAnimationState>('egg_idle');

  const steps: OnboardingStep[] = ['welcome', 'plant', 'hatch'];
  const stepIndex = steps.indexOf(step);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    const todo = await createTodo(db, { title: trimmed });
    trackEvent('first_todo_created', { category_id: todo.categoryId });
    setTodoId(todo.id);
  };

  const handleComplete = async () => {
    if (!todoId) {
      return;
    }
    setPetAnim('egg_hatch');
    const result = await completeTodo(db, todoId);
    const label = GYEOL_LABELS[result.score.gyeolType];
    setGyeolMessage(`${label} +${result.score.points}`);
    trackEvent('first_todo_completed', {
      reward_type: result.score.rewardType,
      gyeol_points: result.score.points,
    });
    setTimeout(() => {
      setStep('hatch');
      setPetAnim('happy');
    }, 1400);
  };

  const handleFinish = async () => {
    await completeOnboarding(db);
    await scheduleCoreSeedReminder(db);
    await loadPetRoom(db);
    router.replace('/(tabs)/today');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.progress}>
        {steps.map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              step === s && styles.progressDotActive,
              steps.indexOf(s) < stepIndex && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      {step === 'welcome' ? (
        <View style={styles.stepBody}>
          <PetSprite assetKey="som_mong" lifeStage="egg" size={petSize} state={petAnim} />
          <Text style={styles.title}>{copy.onboarding.welcomeTitle}</Text>
          <Text style={styles.body}>{copy.onboarding.welcomeBody}</Text>
          <Pressable style={styles.button} onPress={() => setStep('plant')}>
            <Text style={styles.buttonText}>{copy.onboarding.welcomeCta}</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'plant' ? (
        <View style={styles.stepBody}>
          {todoId ? (
            <>
              <View style={styles.todoPreview}>
                <Text style={styles.todoPreviewTitle}>{title}</Text>
              </View>
              <Pressable style={styles.button} onPress={() => void handleComplete()}>
                <Text style={styles.buttonText}>{copy.onboarding.completeCta}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{copy.onboarding.plantTitle}</Text>
              <TextInput
                style={styles.input}
                placeholder={copy.onboarding.plantPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
              <Pressable style={styles.button} onPress={() => void handleCreate()}>
                <Text style={styles.buttonText}>{copy.onboarding.plantCta}</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {step === 'hatch' ? (
        <View style={styles.stepBody}>
          <PetSprite assetKey="som_mong" lifeStage="baby" size={petSize} state={petAnim} />
          <Text style={styles.title}>{copy.onboarding.hatchTitle}</Text>
          <Text style={styles.gyeol}>{gyeolMessage}</Text>
          <Pressable style={styles.button} onPress={() => void handleFinish()}>
            <Text style={styles.buttonText}>{copy.onboarding.hatchCta}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen() {
  return <DatabaseGate>{(db) => <OnboardingContent db={db} />}</DatabaseGate>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  progressDotDone: {
    backgroundColor: colors.textMuted,
  },
  stepBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  gyeol: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  todoPreview: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  todoPreviewTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    minHeight: touchTarget + 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  buttonText: {
    ...typography.label,
    color: '#fff',
  },
});
