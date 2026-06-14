import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Category, TodayTodoView } from '@/domain/gyeol/types';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { copy } from '@/lib/copy';
import { useLayout } from '@/hooks/useLayout';
import { colors, radius, spacing, shadow, touchTarget, typography } from '@/theme';

interface TodoDetailSheetProps {
  visible: boolean;
  item: TodayTodoView | null;
  categories: Category[];
  onClose: () => void;
  onSave: (todoId: string, title: string, categoryId: string, isCoreSeed: boolean) => void;
  onDelete: (todoId: string) => void;
  onUncomplete: (todoId: string) => void;
  onReschedule: (todoId: string) => void;
  onComplete: (todoId: string) => void;
}

export function TodoDetailSheet({
  visible,
  item,
  categories,
  onClose,
  onSave,
  onDelete,
  onUncomplete,
  onReschedule,
  onComplete,
}: TodoDetailSheetProps) {
  const { insets } = useLayout();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isCoreSeed, setIsCoreSeed] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setTitle(item.todo.title);
      setCategoryId(item.category.id);
      setIsCoreSeed(item.todo.isCoreSeed);
    }
  }, [visible, item]);

  if (!item) {
    return null;
  }

  const { todo } = item;
  const isCompleted = todo.status === 'completed';
  const isMist = todo.status === 'mist';
  const canEdit = !isCompleted && todo.status !== 'archived';

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed || !categoryId) {
      return;
    }
    onSave(todo.id, trimmed, categoryId, isCoreSeed);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(copy.todoDetail.delete, copy.todoDetail.deleteConfirm, [
      { text: copy.common.cancel, style: 'cancel' },
      {
        text: copy.common.delete,
        style: 'destructive',
        onPress: () => {
          onDelete(todo.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, shadow.sheet]}>
          <View style={styles.handle} />
          <Text style={styles.heading}>{copy.todoDetail.title}</Text>

          {isMist ? (
            <Text style={styles.mistNote}>{copy.todoDetail.mistNote}</Text>
          ) : null}

          {canEdit ? (
            <>
              <Text style={styles.fieldLabel}>{copy.todoDetail.editTitle}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>{copy.todoInput.categoryLabel}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {categories.map((category) => {
                  const active = category.id === categoryId;
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setCategoryId(category.id)}
                    >
                      <Text
                        style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                      >
                        {category.name}
                      </Text>
                      <Text style={[styles.categoryGyeol, active && styles.categoryChipTextActive]}>
                        {GYEOL_LABELS[category.gyeolType]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{copy.todoInput.coreSeed}</Text>
                <Switch
                  value={isCoreSeed}
                  onValueChange={setIsCoreSeed}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              <Pressable style={styles.primaryButton} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>{copy.todoDetail.save}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyTitle}>{todo.title}</Text>
              <Text style={styles.readOnlyMeta}>
                {item.category.name} · {item.gyeolLabel}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {isMist ? (
              <>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    onReschedule(todo.id);
                    onClose();
                  }}
                >
                  <Text style={styles.secondaryButtonText}>{copy.todoDetail.reschedule}</Text>
                </Pressable>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => {
                    onComplete(todo.id);
                    onClose();
                  }}
                >
                  <Text style={styles.primaryButtonText}>{copy.common.complete}</Text>
                </Pressable>
              </>
            ) : null}
            {isCompleted ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  onUncomplete(todo.id);
                  onClose();
                }}
              >
                <Text style={styles.secondaryButtonText}>{copy.todoDetail.uncomplete}</Text>
              </Pressable>
            ) : null}
            {!isMist && !isCompleted ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  onComplete(todo.id);
                  onClose();
                }}
              >
                <Text style={styles.primaryButtonText}>{copy.common.complete}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.dangerButton} onPress={handleDelete}>
              <Text style={styles.dangerButtonText}>{copy.todoDetail.delete}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  mistNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  categoryChipText: {
    ...typography.label,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  categoryGyeol: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  switchLabel: {
    ...typography.label,
    color: colors.text,
  },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  readOnlyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  readOnlyMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    minHeight: touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.label,
    color: '#fff',
  },
  secondaryButton: {
    minHeight: touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.text,
  },
  dangerButton: {
    minHeight: touchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    ...typography.label,
    color: colors.error,
  },
});
