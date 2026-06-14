import type { Category, GyeolType } from '@/domain/gyeol/types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '@/components/common/ScreenShell';
import { CompletionEffect } from '@/components/pet/CompletionEffect';
import { EvolutionProgressCard } from '@/components/pet/EvolutionProgressCard';
import { MiniPetBanner } from '@/components/pet/MiniPetBanner';
import { EvolutionModal } from '@/components/pet/EvolutionModal';
import { CoreSeedSlots } from '@/components/todo/CoreSeedSlots';
import { TodoDetailSheet } from '@/components/todo/TodoDetailSheet';
import { TodoInputSheet } from '@/components/todo/TodoInputSheet';
import { Toast, TodoItem } from '@/components/todo/TodoItem';
import { DateHeader } from '@/components/today/DateHeader';
import {
  buildPetRoomView,
  createCategory,
  listCategories,
  listMistTodos,
} from '@/db/repositories';
import type { TodayTodoView } from '@/domain/gyeol/types';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { useLayout } from '@/hooks/useLayout';
import { trackEvent } from '@/lib/analytics';
import { copy } from '@/lib/copy';
import { getClock } from '@/lib/clock';
import type { PetAnimationState } from '@/lib/petManifest';
import { DatabaseGate } from '@/stores/dbContext';
import { usePetStore } from '@/stores/petStore';
import { useTodoStore } from '@/stores/todoStore';
import { colors, radius, shadow, spacing, touchTarget, typography } from '@/theme';

function TodayContent({ db }: { db: TodoSomDatabase }) {
  const { fabBottom, scrollBottomPadding, miniPetSize } = useLayout();
  const {
    screenState,
    todos,
    toast,
    loadToday,
    addTodo,
    complete,
    setCoreSeed,
    updateTodoItem,
    removeTodo,
    undoComplete,
    rescheduleMist,
    clearToast,
    clearLastCompletion,
  } = useTodoStore();
  const showEvolution = usePetStore((s) => s.showEvolution);
  const loadPetRoom = usePetStore((s) => s.loadPetRoom);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetCoreSeed, setSheetCoreSeed] = useState(false);
  const [detailItem, setDetailItem] = useState<TodayTodoView | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mistTodos, setMistTodos] = useState<TodayTodoView[]>([]);
  const [petStatus, setPetStatus] = useState<string>(copy.today.petWaiting);
  const [petAssetKey, setPetAssetKey] = useState('som_mong');
  const [petLifeStage, setPetLifeStage] = useState('baby');
  const [petAnim, setPetAnim] = useState<PetAnimationState>('idle');
  const [effectGyeol, setEffectGyeol] = useState<GyeolType | null>(null);
  const [evolutionVisible, setEvolutionVisible] = useState(false);
  const [evolutionInfo, setEvolutionInfo] = useState<{
    resultForm: string | null;
    primaryGyeol: GyeolType | null;
    secondaryGyeol: GyeolType | null;
  }>({
    resultForm: null,
    primaryGyeol: null,
    secondaryGyeol: null,
  });

  const refresh = useCallback(() => {
    void loadToday(db);
    void listCategories(db).then(setCategories);
    void listMistTodos(db).then(setMistTodos);
    void buildPetRoomView(db).then((view) => {
      setPetStatus(view.currentDialogue);
      setPetAssetKey(view.assetKey);
      setPetLifeStage(view.pet.lifeStage);
    });
  }, [db, loadToday]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const findItem = (todoId: string): TodayTodoView | null => {
    return (
      todos.find((t) => t.todo.id === todoId) ??
      mistTodos.find((t) => t.todo.id === todoId) ??
      null
    );
  };

  const openDetail = (todoId: string) => {
    const item = findItem(todoId);
    if (item) {
      setDetailItem(item);
    }
  };

  const triggerPetReaction = (anim: PetAnimationState, gyeol?: GyeolType) => {
    setPetAnim(anim);
    if (gyeol) {
      setEffectGyeol(gyeol);
      setTimeout(() => setEffectGyeol(null), 1200);
    }
    setTimeout(() => setPetAnim('idle'), 1800);
  };

  const handleComplete = async (todoId: string) => {
    await complete(db, todoId);
    const completion = useTodoStore.getState().lastCompletion;
    const item = findItem(todoId);
    const gyeolType = item?.category.gyeolType;

    if (completion?.score.rewardType === 'snack') {
      triggerPetReaction('eat', gyeolType);
    } else {
      triggerPetReaction('happy', gyeolType);
    }

    if (completion?.hatched) {
      setPetStatus(copy.today.petHatched);
      setPetLifeStage('baby');
      setPetAnim('egg_hatch');
      setTimeout(() => setPetAnim('happy'), 2000);
    }
    if (completion?.evolution) {
      setEvolutionInfo({
        resultForm: completion.evolution.resultForm,
        primaryGyeol: completion.evolution.primaryGyeol,
        secondaryGyeol: completion.evolution.secondaryGyeol,
      });
      setEvolutionVisible(true);
      showEvolution();
      await loadPetRoom(db);
    }
    clearLastCompletion();
    refresh();
  };

  const handleCreateCategory = async (name: string, gyeolType: GyeolType) => {
    try {
      const category = await createCategory(db, { name, gyeolType });
      trackEvent('category_created', { gyeol_type: gyeolType });
      const next = await listCategories(db);
      setCategories(next);
      return category;
    } catch {
      return null;
    }
  };

  const coreSeeds = todos.filter((t) => t.todo.isCoreSeed);
  const normalTodos = todos.filter((t) => !t.todo.isCoreSeed);
  const completedTodos = normalTodos.filter((t) => t.todo.status === 'completed');
  const pendingTodos = normalTodos.filter((t) => t.todo.status !== 'completed');
  const todayLabel = getClock().todayDateString();

  const todoItemProps = {
    onComplete: (id: string) => void handleComplete(id),
    onToggleCoreSeed: (id: string, enabled: boolean) => void setCoreSeed(db, id, enabled),
    onPress: openDetail,
    onDelete: (id: string) => void removeTodo(db, id),
  };

  return (
    <View style={styles.root}>
      <ScreenShell
        state={screenState}
        emptyTitle={copy.today.emptyTitle}
        onRetry={refresh}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <DateHeader dateString={todayLabel} />

          <View style={styles.bannerWrap}>
            <MiniPetBanner
              assetKey={petAssetKey}
              lifeStage={petLifeStage}
              message={petStatus}
              petState={petAnim}
              size={miniPetSize}
            />
            {effectGyeol ? <CompletionEffect gyeolType={effectGyeol} /> : null}
          </View>

          <EvolutionProgressCard db={db} />

          <CoreSeedSlots
            items={coreSeeds}
            onSlotPress={(item) => setDetailItem(item)}
            onAddPress={() => {
              setSheetCoreSeed(true);
              setSheetVisible(true);
            }}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.today.sectionTodos}</Text>
            {pendingTodos.length === 0 && completedTodos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{copy.today.emptyTodos}</Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    setSheetCoreSeed(false);
                    setSheetVisible(true);
                  }}
                >
                  <Text style={styles.emptyButtonText}>{copy.today.emptyCta}</Text>
                </Pressable>
              </View>
            ) : null}
            {pendingTodos.map((item) => (
              <TodoItem key={item.todo.id} item={item} {...todoItemProps} />
            ))}
            {completedTodos.length > 0 ? (
              <View style={styles.completedSection}>
                <Text style={styles.completedLabel}>
                  {copy.today.sectionCompleted(completedTodos.length)}
                </Text>
                {completedTodos.map((item) => (
                  <TodoItem
                    key={item.todo.id}
                    item={item}
                    {...todoItemProps}
                    showCoreSeedToggle={false}
                  />
                ))}
              </View>
            ) : null}
          </View>

          {mistTodos.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{copy.today.mistSection}</Text>
              <Text style={styles.mistHint}>{copy.today.mistHint}</Text>
              {mistTodos.map((item) => (
                <TodoItem
                  key={item.todo.id}
                  item={item}
                  onComplete={(id) => void handleComplete(id)}
                  onToggleCoreSeed={() => undefined}
                  onPress={openDetail}
                  onDelete={(id) => void removeTodo(db, id)}
                  showCoreSeedToggle={false}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </ScreenShell>

      <Pressable
        style={[styles.fab, shadow.fab, { bottom: fabBottom }]}
        onPress={() => {
          setSheetCoreSeed(false);
          setSheetVisible(true);
        }}
      >
        <Text style={styles.fabText}>{copy.today.fab}</Text>
      </Pressable>

      <TodoInputSheet
        visible={sheetVisible}
        categories={categories}
        defaultCoreSeed={sheetCoreSeed}
        onClose={() => setSheetVisible(false)}
        onSubmit={(title, isCoreSeed, categoryId) =>
          void addTodo(db, title, isCoreSeed, categoryId)
        }
        onCreateCategory={handleCreateCategory}
      />

      <TodoDetailSheet
        visible={detailItem !== null}
        item={detailItem}
        categories={categories}
        onClose={() => setDetailItem(null)}
        onSave={(todoId, title, categoryId, isCoreSeed) =>
          void updateTodoItem(db, todoId, { title, categoryId, isCoreSeed })
        }
        onDelete={(todoId) => void removeTodo(db, todoId)}
        onUncomplete={(todoId) => void undoComplete(db, todoId)}
        onReschedule={(todoId) => void rescheduleMist(db, todoId)}
        onComplete={(todoId) => void handleComplete(todoId)}
      />

      <Toast message={toast} onHide={clearToast} />

      <EvolutionModal
        visible={evolutionVisible}
        resultForm={evolutionInfo.resultForm}
        primaryGyeol={evolutionInfo.primaryGyeol}
        secondaryGyeol={evolutionInfo.secondaryGyeol}
        onClose={() => setEvolutionVisible(false)}
      />
    </View>
  );
}

export default function TodayScreen() {
  return <DatabaseGate>{(db) => <TodayContent db={db} />}</DatabaseGate>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingTop: spacing.sm,
  },
  bannerWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mistHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyButton: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    ...typography.label,
    color: '#fff',
  },
  completedSection: {
    marginTop: spacing.md,
    opacity: 0.72,
  },
  completedLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    minHeight: touchTarget + 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    ...typography.label,
    color: '#fff',
  },
});
