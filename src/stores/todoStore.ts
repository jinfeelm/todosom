import { create } from 'zustand';
import type { TodayTodoView } from '@/domain/gyeol/types';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import {
  completeTodo,
  countCompletionsForUser,
  countCoreSeedsForDate,
  countEvolutionHistoryForUser,
  countTodosForUser,
  CoreSeedLimitError,
  createTodo,
  deleteTodo,
  ensureLocalUser,
  listCategories,
  listTodayTodos,
  rescheduleMistToToday,
  toggleCoreSeed,
  TodoAlreadyCompletedError,
  TodoNotFoundError,
  uncompleteTodo,
  updateTodo,
  type CompleteTodoResult,
  type UpdateTodoInput,
} from '@/db/repositories';
import { trackEvent } from '@/lib/analytics';
import { getClock } from '@/lib/clock';
import { GYEOL_LABELS } from '@/domain/gyeol/types';
import { copy } from '@/lib/copy';

export type ScreenState = 'loading' | 'empty' | 'ready' | 'error';

interface TodoStore {
  screenState: ScreenState;
  todos: TodayTodoView[];
  toast: string | null;
  errorMessage: string | null;
  lastCompletion: CompleteTodoResult | null;
  loadToday: (db: TodoSomDatabase) => Promise<void>;
  addTodo: (
    db: TodoSomDatabase,
    title: string,
    isCoreSeed?: boolean,
    categoryId?: string,
  ) => Promise<void>;
  complete: (db: TodoSomDatabase, todoId: string) => Promise<void>;
  setCoreSeed: (
    db: TodoSomDatabase,
    todoId: string,
    enabled: boolean,
  ) => Promise<void>;
  updateTodoItem: (
    db: TodoSomDatabase,
    todoId: string,
    input: UpdateTodoInput,
  ) => Promise<void>;
  removeTodo: (db: TodoSomDatabase, todoId: string) => Promise<void>;
  undoComplete: (db: TodoSomDatabase, todoId: string) => Promise<void>;
  rescheduleMist: (db: TodoSomDatabase, todoId: string) => Promise<void>;
  clearToast: () => void;
  clearLastCompletion: () => void;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  screenState: 'loading',
  todos: [],
  toast: null,
  errorMessage: null,
  lastCompletion: null,

  loadToday: async (db) => {
    set({ screenState: 'loading', errorMessage: null });
    try {
      const todos = await listTodayTodos(db);
      set({
        todos,
        screenState: todos.length === 0 ? 'empty' : 'ready',
      });
    } catch {
      set({
        screenState: 'error',
        errorMessage: copy.today.loadError,
      });
    }
  },

  addTodo: async (db, title, isCoreSeed = false, categoryId) => {
    try {
      const user = await ensureLocalUser(db);
      const todoCountBefore = await countTodosForUser(db, user.id);
      const todo = await createTodo(db, { title, isCoreSeed, categoryId });

      if (todoCountBefore === 0) {
        const categories = await listCategories(db);
        const category = categories.find((c) => c.id === todo.categoryId);
        trackEvent('first_todo_created', {
          category_id: todo.categoryId,
          gyeol_type: category?.gyeolType ?? 'focus',
        });
      }

      await get().loadToday(db);
    } catch (error) {
      if (error instanceof CoreSeedLimitError) {
        set({
          toast: copy.today.coreSeedLimit,
        });
        return;
      }
      set({ errorMessage: copy.today.addError });
    }
  },

  complete: async (db, todoId) => {
    const prev = get().todos;
    const completedItem = prev.find((item) => item.todo.id === todoId);
    set({
      todos: prev.map((item) =>
        item.todo.id === todoId
          ? { ...item, todo: { ...item.todo, status: 'completed' as const } }
          : item,
      ),
    });

    try {
      const user = await ensureLocalUser(db);
      const completionCountBefore = await countCompletionsForUser(db, user.id);
      const result = await completeTodo(db, todoId);
      const label = GYEOL_LABELS[result.score.gyeolType];
      const toastMessage =
        result.score.points === 0
          ? copy.today.dailyCapReached
          : `${label} +${result.score.points}`;
      set({
        toast: toastMessage,
        lastCompletion: result,
      });
      trackEvent('gyeol_earned', {
        gyeol_type: result.score.gyeolType,
        reward_type: result.score.rewardType,
        points: result.score.points,
      });

      if (completionCountBefore === 0) {
        trackEvent('first_todo_completed', {
          reward_type: result.score.rewardType,
          gyeol_points: result.score.points,
        });
      }

      if (completedItem?.todo.isCoreSeed) {
        trackEvent('core_seed_completed', {
          gyeol_type: result.score.gyeolType,
          gyeol_points: result.score.points,
        });
      }

      if (result.evolution) {
        const evolutionCount = await countEvolutionHistoryForUser(db, user.id);
        if (evolutionCount === 1) {
          trackEvent('first_evolution_completed', {
            primary_gyeol: result.evolution.primaryGyeol,
            secondary_gyeol: result.evolution.secondaryGyeol,
            result_form: result.evolution.resultForm,
          });
        }
      }

      await get().loadToday(db);
    } catch (error) {
      set({ todos: prev });
      if (error instanceof TodoAlreadyCompletedError) {
        set({ toast: copy.today.alreadyCompleted });
        return;
      }
      set({
        toast: copy.today.completeError,
      });
    }
  },

  setCoreSeed: async (db, todoId, enabled) => {
    try {
      const user = await ensureLocalUser(db);
      await toggleCoreSeed(db, todoId, enabled);
      const today = getClock().todayDateString();
      const coreSeedCount = await countCoreSeedsForDate(db, user.id, today);
      trackEvent('core_seed_selected', {
        date: today,
        core_seed_count: coreSeedCount,
      });
      await get().loadToday(db);
    } catch (error) {
      if (error instanceof CoreSeedLimitError) {
        set({
          toast: copy.today.coreSeedLimit,
        });
      }
    }
  },

  updateTodoItem: async (db, todoId, input) => {
    try {
      await updateTodo(db, todoId, input);
      set({ toast: copy.today.updated });
      await get().loadToday(db);
    } catch (error) {
      if (error instanceof CoreSeedLimitError) {
        set({ toast: copy.today.coreSeedLimit });
        return;
      }
      set({ toast: copy.today.addError });
    }
  },

  removeTodo: async (db, todoId) => {
    const prev = get().todos;
    set({ todos: prev.filter((item) => item.todo.id !== todoId) });
    try {
      await deleteTodo(db, todoId);
      set({ toast: copy.today.deleted });
      await get().loadToday(db);
    } catch (error) {
      set({ todos: prev });
      if (error instanceof TodoNotFoundError) {
        await get().loadToday(db);
        return;
      }
      set({ toast: copy.today.addError });
    }
  },

  undoComplete: async (db, todoId) => {
    try {
      await uncompleteTodo(db, todoId);
      set({ toast: copy.today.uncompleted });
      await get().loadToday(db);
    } catch {
      set({ toast: copy.today.completeError });
    }
  },

  rescheduleMist: async (db, todoId) => {
    try {
      await rescheduleMistToToday(db, todoId);
      set({ toast: copy.today.rescheduled });
      await get().loadToday(db);
    } catch (error) {
      if (error instanceof CoreSeedLimitError) {
        set({ toast: copy.today.coreSeedLimit });
        return;
      }
      set({ toast: copy.today.addError });
    }
  },

  clearToast: () => set({ toast: null }),
  clearLastCompletion: () => set({ lastCompletion: null }),
}));
