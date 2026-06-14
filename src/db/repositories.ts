import { SCORING } from '@/domain/gyeol/constants';
import { buildEvolutionProgress, type EvolutionProgressView } from '@/domain/gyeol/evolutionProgress';
import { evaluateGrowthEvolution } from '@/domain/gyeol/evolution';
import { scoreTodoCompletion } from '@/domain/gyeol/scoring';
import type {
  ArchivePetCardView,
  Category,
  EvolutionHistory,
  GyeolScoreEvent,
  GyeolType,
  PetInstance,
  PetRoomView,
  PetSpecies,
  TodayTodoView,
  Todo,
  TodoCompletion,
  User,
} from '@/domain/gyeol/types';
import { GYEOL_LABELS, ALL_GYEOL_TYPES } from '@/domain/gyeol/types';
import { applyEvolution, applyHatch, canHatch, canStartNewJourney } from '@/domain/pet/lifecycle';
import { DEFAULT_SPECIES_ID } from '@/domain/pet/species';
import { selectDialogue } from '@/domain/pet/dialogue';
import { GROWTH_FORM_MAP } from '@/domain/gyeol/constants';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import {
  mapCategory,
  mapEvolutionHistory,
  mapGyeolScoreEvent,
  mapPetInstance,
  mapPetSpecies,
  mapTodo,
  mapTodoCompletion,
  mapUser,
  type CategoryRow,
  type EvolutionHistoryRow,
  type GyeolScoreEventRow,
  type PetInstanceRow,
  type PetSpeciesRow,
  type TodoCompletionRow,
  type TodoRow,
  type UserRow,
} from '@/db/rowMappers';
import { getClock } from '@/lib/clock';
import { getWeekStartDate } from '@/lib/dateFormat';
import { shouldRolloverMist } from '@/domain/todo/mistRollover';
import { createId, nowIso } from '@/lib/uuid';
import { seedFreshDatabase, wipeAllUserData } from '@/db/seedData';

export class CoreSeedLimitError extends Error {
  constructor() {
    super('core_seed_limit');
    this.name = 'CoreSeedLimitError';
  }
}

export class TodoAlreadyCompletedError extends Error {
  constructor() {
    super('todo_already_completed');
    this.name = 'TodoAlreadyCompletedError';
  }
}

export class TodoNotFoundError extends Error {
  constructor() {
    super('todo_not_found');
    this.name = 'TodoNotFoundError';
  }
}

export class CategoryInUseError extends Error {
  constructor() {
    super('category_in_use');
    this.name = 'CategoryInUseError';
  }
}

export class LastCategoryError extends Error {
  constructor() {
    super('last_category');
    this.name = 'LastCategoryError';
  }
}

export interface UpdateTodoInput {
  title?: string;
  categoryId?: string;
  isCoreSeed?: boolean;
}

export interface CompleteTodoResult {
  score: {
    rewardType: string;
    gyeolType: GyeolType;
    points: number;
    reason: string;
  };
  hatched: boolean;
  evolution: EvolutionHistory | null;
}

export interface CreateTodoInput {
  title: string;
  categoryId?: string;
  dueDate?: string;
  isCoreSeed?: boolean;
  difficulty?: Todo['difficulty'];
}

export async function ensureLocalUser(db: TodoSomDatabase): Promise<User> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users LIMIT 1');
  if (!row) {
    throw new Error('No local user found after seed');
  }
  return mapUser(row);
}

export async function getSetting(db: TodoSomDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: TodoSomDatabase,
  key: string,
  value: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, nowIso()],
  );
}

export interface CreateCategoryInput {
  name: string;
  gyeolType: GyeolType;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  gyeolType?: GyeolType;
  color?: string;
}

export interface BuildPetRoomViewOptions {
  previousLastOpenAt?: string | null;
}

export async function createCategory(
  db: TodoSomDatabase,
  input: CreateCategoryInput,
): Promise<Category> {
  const user = await ensureLocalUser(db);
  const ts = nowIso();
  const id = createId();
  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, gyeol_type, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user.id,
      input.name.trim(),
      input.gyeolType,
      input.color ?? '#6B8F71',
      ts,
      ts,
    ],
  );
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
  if (!row) {
    throw new Error('Failed to create category');
  }
  return mapCategory(row);
}

export async function updateCategory(
  db: TodoSomDatabase,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [categoryId],
  );
  if (!row) {
    throw new Error('Category not found');
  }
  const ts = nowIso();
  await db.runAsync(
    `UPDATE categories SET name = ?, gyeol_type = ?, color = ?, updated_at = ? WHERE id = ?`,
    [
      input.name?.trim() ?? row.name,
      input.gyeolType ?? row.gyeol_type,
      input.color ?? row.color,
      ts,
      categoryId,
    ],
  );
  const updated = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [categoryId],
  );
  return mapCategory(updated!);
}

export async function countTodosForUser(
  db: TodoSomDatabase,
  userId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM todos WHERE user_id = ?',
    [userId],
  );
  return row?.count ?? 0;
}

export async function countCompletionsForUser(
  db: TodoSomDatabase,
  userId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM todo_completions WHERE user_id = ?',
    [userId],
  );
  return row?.count ?? 0;
}

export function computeDaysSinceLastVisit(
  previousLastOpenAt: string | null | undefined,
  now: Date = getClock().now(),
): number {
  if (!previousLastOpenAt) {
    return 0;
  }
  return Math.floor(
    (now.getTime() - new Date(previousLastOpenAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

async function listCompletionsForPet(
  db: TodoSomDatabase,
  userId: string,
  petInstanceId: string,
): Promise<TodoCompletion[]> {
  const rows = await db.getAllAsync<TodoCompletionRow>(
    `SELECT tc.* FROM todo_completions tc
     INNER JOIN gyeol_score_events gse
       ON gse.todo_id = tc.todo_id AND gse.pet_instance_id = ?
     WHERE tc.user_id = ?
     ORDER BY tc.completed_at`,
    [petInstanceId, userId],
  );
  return rows.map(mapTodoCompletion);
}

export async function listCategories(db: TodoSomDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name');
  return rows.map(mapCategory);
}

export async function getDefaultCategory(db: TodoSomDatabase): Promise<Category> {
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY created_at LIMIT 1',
  );
  if (!row) {
    throw new Error('No default category');
  }
  return mapCategory(row);
}

export async function countCoreSeedsForDate(
  db: TodoSomDatabase,
  userId: string,
  dueDate: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM todos
     WHERE user_id = ? AND due_date = ? AND is_core_seed = 1 AND status != 'archived'`,
    [userId, dueDate],
  );
  return row?.count ?? 0;
}

export async function listTodayTodos(db: TodoSomDatabase): Promise<TodayTodoView[]> {
  const user = await ensureLocalUser(db);
  const today = getClock().todayDateString();
  const coreCount = await countCoreSeedsForDate(db, user.id, today);

  const rows = await db.getAllAsync<TodoRow>(
    `SELECT * FROM todos
     WHERE user_id = ? AND due_date = ? AND status IN ('open', 'completed')
     ORDER BY is_core_seed DESC, created_at ASC`,
    [user.id, today],
  );

  const categories = await listCategories(db);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return rows.map((row) => {
    const todo = mapTodo(row);
    const category = categoryMap.get(todo.categoryId);
    if (!category) {
      throw new Error(`Category not found for todo ${todo.id}`);
    }
    const canMarkCoreSeed =
      todo.isCoreSeed || coreCount < SCORING.maxCoreSeedsPerDay;
    return {
      todo,
      category,
      gyeolLabel: GYEOL_LABELS[category.gyeolType],
      canMarkCoreSeed,
    };
  });
}

export async function listMistTodos(db: TodoSomDatabase): Promise<TodayTodoView[]> {
  const user = await ensureLocalUser(db);
  const today = getClock().todayDateString();

  const rows = await db.getAllAsync<TodoRow>(
    `SELECT * FROM todos
     WHERE user_id = ? AND due_date < ? AND status = 'mist'
     ORDER BY due_date DESC, created_at ASC`,
    [user.id, today],
  );

  const categories = await listCategories(db);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return rows.map((row) => {
    const todo = mapTodo(row);
    const category = categoryMap.get(todo.categoryId);
    if (!category) {
      throw new Error(`Category not found for todo ${todo.id}`);
    }
    return {
      todo,
      category,
      gyeolLabel: GYEOL_LABELS[category.gyeolType],
      canMarkCoreSeed: false,
    };
  });
}

const MIST_ROLLOVER_KEY = 'last_mist_rollover_date';

export async function rolloverOpenTodosToMist(db: TodoSomDatabase): Promise<number> {
  const user = await ensureLocalUser(db);
  const today = getClock().todayDateString();
  const lastRollover = await getSetting(db, MIST_ROLLOVER_KEY);

  if (!shouldRolloverMist(lastRollover, today)) {
    return 0;
  }

  const ts = nowIso();
  const result = await db.runAsync(
    `UPDATE todos SET status = 'mist', updated_at = ?
     WHERE user_id = ? AND due_date < ? AND status = 'open'`,
    [ts, user.id, today],
  );

  await setSetting(db, MIST_ROLLOVER_KEY, today);
  return result.changes ?? 0;
}

export async function aggregateWeeklyGyeolScores(
  db: TodoSomDatabase,
): Promise<{ scores: Record<GyeolType, number>; totalPoints: number }> {
  const user = await ensureLocalUser(db);
  const today = getClock().todayDateString();
  const weekStart = getWeekStartDate(today);

  const scores: Record<GyeolType, number> = {
    focus: 0,
    create: 0,
    learn: 0,
    breakthrough: 0,
    care: 0,
    connect: 0,
    organize: 0,
  };

  const rows = await db.getAllAsync<{ gyeol_type: GyeolType; total: number }>(
    `SELECT gyeol_type, SUM(points) as total FROM gyeol_score_events
     WHERE user_id = ? AND date(occurred_at) >= date(?)
     GROUP BY gyeol_type`,
    [user.id, weekStart],
  );

  let totalPoints = 0;
  for (const row of rows) {
    scores[row.gyeol_type] = row.total;
    totalPoints += row.total;
  }

  return { scores, totalPoints };
}

export async function createTodo(
  db: TodoSomDatabase,
  input: CreateTodoInput,
): Promise<Todo> {
  const user = await ensureLocalUser(db);
  const category = input.categoryId
    ? await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [
        input.categoryId,
      ])
    : await db.getFirstAsync<CategoryRow>(
        'SELECT * FROM categories ORDER BY created_at LIMIT 1',
      );
  if (!category) {
    throw new Error('Category not found');
  }

  const dueDate = input.dueDate ?? getClock().todayDateString();
  const isCoreSeed = input.isCoreSeed ?? false;

  if (isCoreSeed) {
    const count = await countCoreSeedsForDate(db, user.id, dueDate);
    if (count >= SCORING.maxCoreSeedsPerDay) {
      throw new CoreSeedLimitError();
    }
  }

  const ts = nowIso();
  const id = createId();
  await db.runAsync(
    `INSERT INTO todos (
      id, user_id, title, category_id, due_date, is_core_seed, difficulty,
      status, planned_at, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NULL, NULL, ?, ?)`,
    [
      id,
      user.id,
      input.title.trim(),
      category.id,
      dueDate,
      isCoreSeed ? 1 : 0,
      input.difficulty ?? 'normal',
      ts,
      ts,
    ],
  );

  const row = await db.getFirstAsync<TodoRow>('SELECT * FROM todos WHERE id = ?', [id]);
  if (!row) {
    throw new Error('Failed to create todo');
  }
  return mapTodo(row);
}

export async function toggleCoreSeed(
  db: TodoSomDatabase,
  todoId: string,
  enabled: boolean,
): Promise<Todo> {
  const user = await ensureLocalUser(db);
  const todoRow = await db.getFirstAsync<TodoRow>('SELECT * FROM todos WHERE id = ?', [
    todoId,
  ]);
  if (!todoRow) {
    throw new Error('Todo not found');
  }
  const todo = mapTodo(todoRow);

  if (enabled && !todo.isCoreSeed) {
    const count = await countCoreSeedsForDate(db, user.id, todo.dueDate);
    if (count >= SCORING.maxCoreSeedsPerDay) {
      throw new CoreSeedLimitError();
    }
  }

  const ts = nowIso();
  await db.runAsync(
    'UPDATE todos SET is_core_seed = ?, updated_at = ? WHERE id = ?',
    [enabled ? 1 : 0, ts, todoId],
  );

  const updated = await db.getFirstAsync<TodoRow>('SELECT * FROM todos WHERE id = ?', [
    todoId,
  ]);
  return mapTodo(updated!);
}

async function getTodoForUser(
  db: TodoSomDatabase,
  todoId: string,
  userId: string,
): Promise<Todo> {
  const row = await db.getFirstAsync<TodoRow>(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?',
    [todoId, userId],
  );
  if (!row) {
    throw new TodoNotFoundError();
  }
  return mapTodo(row);
}

async function deleteTodoSideEffects(db: TodoSomDatabase, todoId: string): Promise<void> {
  await db.runAsync('DELETE FROM gyeol_score_events WHERE todo_id = ?', [todoId]);
  await db.runAsync('DELETE FROM todo_completions WHERE todo_id = ?', [todoId]);
}

export async function updateTodo(
  db: TodoSomDatabase,
  todoId: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  const user = await ensureLocalUser(db);
  const todo = await getTodoForUser(db, todoId, user.id);

  if (todo.status === 'completed' || todo.status === 'archived') {
    throw new Error('todo_not_editable');
  }

  if (input.isCoreSeed === true && !todo.isCoreSeed) {
    const today = todo.dueDate;
    const count = await countCoreSeedsForDate(db, user.id, today);
    if (count >= SCORING.maxCoreSeedsPerDay) {
      throw new CoreSeedLimitError();
    }
  }

  if (input.categoryId) {
    const category = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ?',
      [input.categoryId],
    );
    if (!category) {
      throw new Error('Category not found');
    }
  }

  const ts = nowIso();
  await db.runAsync(
    `UPDATE todos SET
      title = ?,
      category_id = ?,
      is_core_seed = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      input.title?.trim() ?? todo.title,
      input.categoryId ?? todo.categoryId,
      input.isCoreSeed !== undefined ? (input.isCoreSeed ? 1 : 0) : todo.isCoreSeed ? 1 : 0,
      ts,
      todoId,
    ],
  );

  return getTodoForUser(db, todoId, user.id);
}

export async function deleteTodo(db: TodoSomDatabase, todoId: string): Promise<void> {
  const user = await ensureLocalUser(db);
  await getTodoForUser(db, todoId, user.id);
  await db.withTransactionAsync(async () => {
    await deleteTodoSideEffects(db, todoId);
    await db.runAsync('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, user.id]);
  });
}

export async function uncompleteTodo(db: TodoSomDatabase, todoId: string): Promise<Todo> {
  const user = await ensureLocalUser(db);
  const todo = await getTodoForUser(db, todoId, user.id);
  if (todo.status !== 'completed') {
    throw new Error('todo_not_completed');
  }

  const ts = nowIso();
  await db.withTransactionAsync(async () => {
    await deleteTodoSideEffects(db, todoId);
    await db.runAsync(
      `UPDATE todos SET status = 'open', completed_at = NULL, updated_at = ? WHERE id = ?`,
      [ts, todoId],
    );
  });

  return getTodoForUser(db, todoId, user.id);
}

export async function rescheduleMistToToday(db: TodoSomDatabase, todoId: string): Promise<Todo> {
  const user = await ensureLocalUser(db);
  const todo = await getTodoForUser(db, todoId, user.id);
  if (todo.status !== 'mist') {
    throw new Error('todo_not_mist');
  }

  const today = getClock().todayDateString();
  if (todo.isCoreSeed) {
    const count = await countCoreSeedsForDate(db, user.id, today);
    if (count >= SCORING.maxCoreSeedsPerDay) {
      throw new CoreSeedLimitError();
    }
  }

  const ts = nowIso();
  await db.runAsync(
    `UPDATE todos SET status = 'open', due_date = ?, updated_at = ? WHERE id = ?`,
    [today, ts, todoId],
  );

  return getTodoForUser(db, todoId, user.id);
}

export async function archiveTodo(db: TodoSomDatabase, todoId: string): Promise<void> {
  const user = await ensureLocalUser(db);
  await getTodoForUser(db, todoId, user.id);
  const ts = nowIso();
  await db.runAsync(
    `UPDATE todos SET status = 'archived', updated_at = ? WHERE id = ? AND user_id = ?`,
    [ts, todoId, user.id],
  );
}

export async function countTodosInCategory(
  db: TodoSomDatabase,
  categoryId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM todos WHERE category_id = ?',
    [categoryId],
  );
  return row?.count ?? 0;
}

export async function deleteCategory(db: TodoSomDatabase, categoryId: string): Promise<void> {
  const categories = await listCategories(db);
  if (categories.length <= 1) {
    throw new LastCategoryError();
  }

  const fallback = categories.find((c) => c.id !== categoryId);
  if (!fallback) {
    throw new LastCategoryError();
  }

  const ts = nowIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE todos SET category_id = ?, updated_at = ? WHERE category_id = ?',
      [fallback.id, ts, categoryId],
    );
    await db.runAsync('DELETE FROM categories WHERE id = ?', [categoryId]);
  });
}

export async function getEvolutionProgress(db: TodoSomDatabase): Promise<EvolutionProgressView> {
  const user = await ensureLocalUser(db);
  const pet = await getCurrentPet(db);
  const events = await db.getAllAsync<GyeolScoreEventRow>(
    'SELECT * FROM gyeol_score_events WHERE pet_instance_id = ?',
    [pet.id],
  );
  const completions = await listCompletionsForPet(db, user.id, pet.id);
  const evolutionCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM evolution_history WHERE pet_instance_id = ? AND to_stage = 'growth'`,
    [pet.id],
  );

  return buildEvolutionProgress({
    pet,
    events: events.map(mapGyeolScoreEvent),
    completions,
    existingEvolutionCount: evolutionCount?.count ?? 0,
    now: getClock().now(),
  });
}

export async function resetAllAppData(db: TodoSomDatabase): Promise<void> {
  await wipeAllUserData(db);
  await seedFreshDatabase(db);
}

export async function getCurrentPet(db: TodoSomDatabase): Promise<PetInstance> {
  const user = await ensureLocalUser(db);
  const row = await db.getFirstAsync<PetInstanceRow>(
    `SELECT * FROM pet_instances
     WHERE user_id = ? AND archived_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  if (!row) {
    throw new Error('No current pet');
  }
  return mapPetInstance(row);
}

export async function getPetSpecies(
  db: TodoSomDatabase,
  speciesId: string,
): Promise<PetSpecies> {
  const row = await db.getFirstAsync<PetSpeciesRow>(
    'SELECT * FROM pet_species WHERE id = ?',
    [speciesId],
  );
  if (!row) {
    throw new Error('Species not found');
  }
  return mapPetSpecies(row);
}

async function getSameCategoryCompletionCountToday(
  db: TodoSomDatabase,
  userId: string,
  categoryId: string,
  dueDate: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM todo_completions tc
     JOIN todos t ON t.id = tc.todo_id
     WHERE tc.user_id = ? AND t.category_id = ? AND t.due_date = ?`,
    [userId, categoryId, dueDate],
  );
  return row?.count ?? 0;
}

async function getDailyEvolutionPoints(
  db: TodoSomDatabase,
  userId: string,
  dueDate: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(points), 0) as total FROM gyeol_score_events
     WHERE user_id = ? AND date(occurred_at) = date(?)`,
    [userId, dueDate],
  );
  return row?.total ?? 0;
}

export async function completeTodo(
  db: TodoSomDatabase,
  todoId: string,
): Promise<CompleteTodoResult> {
  const user = await ensureLocalUser(db);
  const pet = await getCurrentPet(db);
  const completedAt = getClock().now();
  const completedAtIso = completedAt.toISOString();

  let result: CompleteTodoResult = {
    score: { rewardType: 'small_evolution', gyeolType: 'focus', points: 0, reason: '' },
    hatched: false,
    evolution: null,
  };

  await db.withTransactionAsync(async () => {
    const todoRow = await db.getFirstAsync<TodoRow>(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [todoId, user.id],
    );
    if (!todoRow) {
      throw new Error('Todo not found');
    }
    const todo = mapTodo(todoRow);
    if (todo.status === 'completed') {
      throw new TodoAlreadyCompletedError();
    }

    const existingCompletion = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM todo_completions WHERE todo_id = ?',
      [todoId],
    );
    if (existingCompletion) {
      throw new TodoAlreadyCompletedError();
    }

    const categoryRow = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ?',
      [todo.categoryId],
    );
    if (!categoryRow) {
      throw new Error('Category not found');
    }
    const category = mapCategory(categoryRow);

    const sameCategoryCount = await getSameCategoryCompletionCountToday(
      db,
      user.id,
      category.id,
      todo.dueDate,
    );
    const dailyPoints = await getDailyEvolutionPoints(db, user.id, todo.dueDate);

    const score = scoreTodoCompletion({
      todo,
      category,
      completedAt,
      sameCategoryCompletionCountToday: sameCategoryCount,
      currentDailyEvolutionPoints: dailyPoints,
    });

    const ts = nowIso();
    await db.runAsync(
      `UPDATE todos SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
      [completedAtIso, ts, todoId],
    );

    const completionId = createId();
    await db.runAsync(
      `INSERT INTO todo_completions (
        id, todo_id, user_id, completed_at, reward_type, gyeol_type, gyeol_points, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        completionId,
        todoId,
        user.id,
        completedAtIso,
        score.rewardType,
        score.gyeolType,
        score.points,
        score.reason,
      ],
    );

    const eventId = createId();
    await db.runAsync(
      `INSERT INTO gyeol_score_events (
        id, user_id, pet_instance_id, todo_id, gyeol_type, reward_type, points, reason, occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        user.id,
        pet.id,
        todoId,
        score.gyeolType,
        score.rewardType,
        score.points,
        score.reason,
        completedAtIso,
      ],
    );

    let hatched = false;
    const currentPetRow = await db.getFirstAsync<PetInstanceRow>(
      'SELECT * FROM pet_instances WHERE id = ?',
      [pet.id],
    );
    if (currentPetRow && canHatch(mapPetInstance(currentPetRow))) {
      const hatchedPet = applyHatch(mapPetInstance(currentPetRow), ts);
      await db.runAsync(
        `UPDATE pet_instances SET life_stage = ?, updated_at = ? WHERE id = ?`,
        [hatchedPet.lifeStage, ts, pet.id],
      );
      hatched = true;
    }

    result = {
      score: {
        rewardType: score.rewardType,
        gyeolType: score.gyeolType,
        points: score.points,
        reason: score.reason,
      },
      hatched,
      evolution: null,
    };
  });

  const evolution = await evaluateAndApplyEvolution(db);
  result.evolution = evolution;
  return result;
}

export async function countEvolutionHistoryForUser(
  db: TodoSomDatabase,
  userId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM evolution_history WHERE user_id = ?',
    [userId],
  );
  return row?.count ?? 0;
}

export async function evaluateAndApplyEvolution(
  db: TodoSomDatabase,
): Promise<EvolutionHistory | null> {
  const user = await ensureLocalUser(db);
  const pet = await getCurrentPet(db);

  const events = await db.getAllAsync<GyeolScoreEventRow>(
    'SELECT * FROM gyeol_score_events WHERE pet_instance_id = ? ORDER BY occurred_at',
    [pet.id],
  );
  const completions = await listCompletionsForPet(db, user.id, pet.id);

  const evolutionCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM evolution_history
     WHERE pet_instance_id = ? AND to_stage = 'growth'`,
    [pet.id],
  );

  const decision = evaluateGrowthEvolution({
    pet,
    events: events.map(mapGyeolScoreEvent),
    completions,
    existingEvolutionCount: evolutionCount?.count ?? 0,
    now: getClock().now(),
  });

  if (decision.kind !== 'evolve') {
    return null;
  }

  const ts = nowIso();
  const historyId = createId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO evolution_history (
        id, user_id, pet_instance_id, from_stage, to_stage, result_form,
        primary_gyeol, secondary_gyeol, evolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        user.id,
        pet.id,
        decision.fromStage,
        decision.toStage,
        decision.resultForm,
        decision.primaryGyeol,
        decision.secondaryGyeol,
        ts,
      ],
    );

    const evolvedPet = applyEvolution(
      pet,
      decision.primaryGyeol,
      decision.secondaryGyeol,
      ts,
    );
    await db.runAsync(
      `UPDATE pet_instances SET life_stage = ?, primary_gyeol = ?, secondary_gyeol = ?, updated_at = ?
       WHERE id = ?`,
      [
        evolvedPet.lifeStage,
        evolvedPet.primaryGyeol,
        evolvedPet.secondaryGyeol,
        ts,
        pet.id,
      ],
    );
  });

  const historyRow = await db.getFirstAsync<EvolutionHistoryRow>(
    'SELECT * FROM evolution_history WHERE id = ?',
    [historyId],
  );
  return historyRow ? mapEvolutionHistory(historyRow) : null;
}

export async function aggregateTodayGyeolScores(
  db: TodoSomDatabase,
): Promise<Record<GyeolType, number>> {
  const user = await ensureLocalUser(db);
  const today = getClock().todayDateString();
  const scores: Record<GyeolType, number> = {
    focus: 0,
    create: 0,
    learn: 0,
    breakthrough: 0,
    care: 0,
    connect: 0,
    organize: 0,
  };

  const rows = await db.getAllAsync<{ gyeol_type: GyeolType; total: number }>(
    `SELECT gyeol_type, SUM(points) as total FROM gyeol_score_events
     WHERE user_id = ? AND date(occurred_at) = date(?)
     GROUP BY gyeol_type`,
    [user.id, today],
  );

  for (const row of rows) {
    scores[row.gyeol_type] = row.total;
  }
  return scores;
}

export async function listArchivedPets(
  db: TodoSomDatabase,
): Promise<ArchivePetCardView[]> {
  const user = await ensureLocalUser(db);
  const rows = await db.getAllAsync<PetInstanceRow & { result_form: string | null }>(
    `SELECT p.*, (
       SELECT result_form FROM evolution_history eh
       WHERE eh.pet_instance_id = p.id ORDER BY evolved_at DESC LIMIT 1
     ) as result_form
     FROM pet_instances p
     WHERE p.user_id = ? AND p.archived_at IS NOT NULL
     ORDER BY p.archived_at DESC`,
    [user.id],
  );

  return rows.map((row) => ({
    petInstanceId: row.id,
    displayName: row.name ?? '솜몽',
    lifeStage: row.life_stage,
    resultForm: row.result_form,
    primaryGyeol: row.primary_gyeol,
    archivedAt: row.archived_at,
  }));
}

export async function listEvolutionHistory(
  db: TodoSomDatabase,
  petInstanceId: string,
): Promise<EvolutionHistory[]> {
  const rows = await db.getAllAsync<EvolutionHistoryRow>(
    'SELECT * FROM evolution_history WHERE pet_instance_id = ? ORDER BY evolved_at DESC',
    [petInstanceId],
  );
  return rows.map(mapEvolutionHistory);
}

export async function archiveCurrentPetAndStartNew(
  db: TodoSomDatabase,
): Promise<PetInstance> {
  const user = await ensureLocalUser(db);
  const currentPet = await getCurrentPet(db);

  if (!canStartNewJourney(currentPet)) {
    throw new Error('new_journey_not_available');
  }

  const ts = nowIso();
  const newPetId = createId();
  const newRoomId = createId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE pet_instances SET life_stage = 'archived', archived_at = ?, updated_at = ? WHERE id = ?`,
      [ts, ts, currentPet.id],
    );
    await db.runAsync(
      `INSERT INTO pet_instances (
        id, user_id, species_id, name, life_stage, primary_gyeol, secondary_gyeol,
        affection, started_at, archived_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'egg', NULL, NULL, 0, ?, NULL, ?, ?)`,
      [newPetId, user.id, DEFAULT_SPECIES_ID, null, ts, ts, ts],
    );
    await db.runAsync(
      `INSERT INTO rooms (id, user_id, pet_instance_id, theme_id, created_at, updated_at)
       VALUES (?, ?, ?, 'default_room', ?, ?)`,
      [newRoomId, user.id, newPetId, ts, ts],
    );
  });

  const row = await db.getFirstAsync<PetInstanceRow>(
    'SELECT * FROM pet_instances WHERE id = ?',
    [newPetId],
  );
  return mapPetInstance(row!);
}

export async function buildPetRoomView(
  db: TodoSomDatabase,
  options: BuildPetRoomViewOptions = {},
): Promise<PetRoomView> {
  const pet = await getCurrentPet(db);
  const species = await getPetSpecies(db, pet.speciesId);
  const todayScores = await aggregateTodayGyeolScores(db);

  const events = await db.getAllAsync<GyeolScoreEventRow>(
    'SELECT * FROM gyeol_score_events WHERE pet_instance_id = ?',
    [pet.id],
  );
  const completions = await listCompletionsForPet(db, pet.userId, pet.id);
  const evolutionCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM evolution_history WHERE pet_instance_id = ? AND to_stage = 'growth'`,
    [pet.id],
  );

  const decision = evaluateGrowthEvolution({
    pet,
    events: events.map(mapGyeolScoreEvent),
    completions,
    existingEvolutionCount: evolutionCount?.count ?? 0,
    now: getClock().now(),
  });

  const daysSinceLastVisit = computeDaysSinceLastVisit(options.previousLastOpenAt);

  const today = getClock().todayDateString();
  const snackCountToday = events.filter(
    (e) => e.reward_type === 'snack' && e.occurred_at.startsWith(today),
  ).length;

  const dialogue = selectDialogue({
    lifeStage: pet.lifeStage,
    isFirstVisit: false,
    isOnboardingHatch: false,
    coreSeedJustCompleted: false,
    snackCountToday,
    daysSinceLastVisit,
    canEvolve: decision.kind === 'evolve',
  });

  const assetKey =
    pet.lifeStage === 'growth' && pet.primaryGyeol
      ? growthFormAsset(pet.primaryGyeol)
      : species.assetKey;

  const history = await db.getFirstAsync<EvolutionHistoryRow>(
    'SELECT * FROM evolution_history WHERE pet_instance_id = ? ORDER BY evolved_at DESC LIMIT 1',
    [pet.id],
  );

  return {
    pet,
    species,
    todayScores,
    currentDialogue: dialogue.text,
    dialogueAnimationState: dialogue.animationState,
    assetKey,
    canEvolve: decision.kind === 'evolve',
    resultForm: history?.result_form ?? null,
    snackCountToday,
    daysSinceLastVisit,
  };
}

function growthFormAsset(gyeol: GyeolType): string {
  return GROWTH_FORM_MAP[gyeol];
}

export function emptyGyeolScores(): Record<GyeolType, number> {
  return ALL_GYEOL_TYPES.reduce(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    {} as Record<GyeolType, number>,
  );
}

export async function recordAppOpen(
  db: TodoSomDatabase,
): Promise<{ previousLastOpenAt: string | null }> {
  const previousLastOpenAt = await getSetting(db, 'last_app_open_at');
  await setSetting(db, 'last_app_open_at', nowIso());
  return { previousLastOpenAt };
}

/** @deprecated Use recordAppOpen to preserve previous visit time for dialogue. */
export async function updateLastAppOpen(db: TodoSomDatabase): Promise<void> {
  await setSetting(db, 'last_app_open_at', nowIso());
}
