import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PetSprite } from '@/components/pet/PetSprite';
import { GROWTH_DISPLAY_NAMES } from '@/domain/gyeol/constants';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import type { GyeolType } from '@/domain/gyeol/types';
import { useLayout } from '@/hooks/useLayout';
import { colors, radius, shadow, spacing, touchTarget, typography } from '@/theme';

interface EvolutionModalProps {
  visible: boolean;
  resultForm: string | null;
  primaryGyeol: GyeolType | null;
  secondaryGyeol: GyeolType | null;
  onClose: () => void;
}

export function EvolutionModal({
  visible,
  resultForm,
  primaryGyeol,
  secondaryGyeol,
  onClose,
}: EvolutionModalProps) {
  const { width } = useLayout();
  const formName = resultForm ? GROWTH_DISPLAY_NAMES[resultForm] ?? resultForm : '새로운 모습';
  const cardMaxWidth = Math.min(360, width - 32);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, shadow.modal, { maxWidth: cardMaxWidth }]}>
          <Text style={styles.title}>성장기 진화</Text>
          <PetSprite
            assetKey={resultForm ?? 'som_mong'}
            lifeStage="growth"
            size={200}
            state="evolve"
          />
          <Text style={styles.formName}>{formName}</Text>
          {primaryGyeol ? (
            <Text style={styles.detail}>주요 결 · {GYEOL_LABELS[primaryGyeol]}</Text>
          ) : null}
          {secondaryGyeol ? (
            <Text style={styles.detail}>보조 결 · {GYEOL_LABELS[secondaryGyeol]}</Text>
          ) : null}
          <Text style={styles.message}>
            같은 솜뭉치가, 다른 하루를 먹고, 다르게 자랐어요.
          </Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>펫방으로</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  formName: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  button: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    ...typography.label,
    color: '#fff',
  },
});
