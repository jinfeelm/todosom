import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Category, GyeolType } from '@/domain/gyeol/types';
import { ALL_GYEOL_TYPES, GYEOL_LABELS } from '@/domain/gyeol/types';
import { colors, radius, spacing, shadow, touchTarget, typography } from '@/theme';
import { copy } from '@/lib/copy';
import { useLayout } from '@/hooks/useLayout';

interface TodoInputSheetProps {
  visible: boolean;
  categories: Category[];
  defaultCoreSeed?: boolean;
  onClose: () => void;
  onSubmit: (title: string, isCoreSeed: boolean, categoryId: string) => void;
  onCreateCategory: (name: string, gyeolType: GyeolType) => Promise<Category | null>;
}

export function TodoInputSheet({
  visible,
  categories,
  defaultCoreSeed = false,
  onClose,
  onSubmit,
  onCreateCategory,
}: TodoInputSheetProps) {
  const { insets } = useLayout();
  const [title, setTitle] = useState('');
  const [isCoreSeed, setIsCoreSeed] = useState(defaultCoreSeed);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryGyeol, setNewCategoryGyeol] = useState<GyeolType>('focus');

  useEffect(() => {
    if (visible) {
      setIsCoreSeed(defaultCoreSeed);
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryGyeol('focus');
      if (categories.length > 0) {
        setSelectedCategoryId((current) =>
          current && categories.some((c) => c.id === current) ? current : categories[0].id,
        );
      }
    }
  }, [visible, defaultCoreSeed, categories]);

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? categories[0] ?? null;

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }
    const created = await onCreateCategory(trimmed, newCategoryGyeol);
    if (created) {
      setSelectedCategoryId(created.id);
      setShowNewCategory(false);
      setNewCategoryName('');
    }
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed || !selectedCategory) {
      return;
    }
    onSubmit(trimmed, isCoreSeed, selectedCategory.id);
    setTitle('');
    setIsCoreSeed(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }, shadow.sheet]}>
          <View style={styles.handle} />
          <Text style={styles.heading}>{copy.todoInput.title}</Text>
          <TextInput
            style={styles.input}
            placeholder={copy.todoInput.placeholder}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <Text style={styles.fieldLabel}>{copy.todoInput.categoryLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((category) => {
              const active = category.id === selectedCategoryId;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryGyeol, active && styles.categoryChipTextActive]}>
                    {GYEOL_LABELS[category.gyeolType]}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.addCategoryChip}
              onPress={() => setShowNewCategory((v) => !v)}
            >
              <Text style={styles.addCategoryText}>{copy.todoInput.newCategory}</Text>
            </Pressable>
          </ScrollView>

          {showNewCategory ? (
            <View style={styles.newCategoryBox}>
              <TextInput
                style={styles.newCategoryInput}
                placeholder={copy.todoInput.categoryPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gyeolRow}>
                  {ALL_GYEOL_TYPES.map((type) => {
                    const active = newCategoryGyeol === type;
                    return (
                      <Pressable
                        key={type}
                        style={[styles.gyeolChip, active && styles.gyeolChipActive]}
                        onPress={() => setNewCategoryGyeol(type)}
                      >
                        <Text style={[styles.gyeolChipText, active && styles.gyeolChipTextActive]}>
                          {GYEOL_LABELS[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Pressable style={styles.createCategoryButton} onPress={() => void handleCreateCategory()}>
                <Text style={styles.createCategoryText}>{copy.todoInput.createCategory}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>{copy.todoInput.coreSeed}</Text>
              <Text style={styles.switchHint}>{copy.todoInput.coreSeedHint}</Text>
            </View>
            <Switch
              value={isCoreSeed}
              onValueChange={setIsCoreSeed}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>{copy.todoInput.submit}</Text>
          </Pressable>
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
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget + 8,
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
    minWidth: 88,
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
  addCategoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addCategoryText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  newCategoryBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  newCategoryInput: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  gyeolRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  gyeolChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  gyeolChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gyeolChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  gyeolChipTextActive: {
    color: colors.primary,
  },
  createCategoryButton: {
    minHeight: touchTarget - 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCategoryText: {
    ...typography.caption,
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.label,
    color: colors.text,
  },
  switchHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  submitButton: {
    minHeight: touchTarget + 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...typography.label,
    color: '#fff',
  },
});
