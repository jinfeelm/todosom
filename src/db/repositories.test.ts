import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { normalizeParams, openDatabase, resetDatabaseInstance } from '@/db/localDb.web';
import {
  buildPetRoomView,
  completeTodo,
  createCategory,
  createTodo,
  deleteCategory,
  deleteTodo,
  evaluateAndApplyEvolution,
  getEvolutionProgress,
  LastCategoryError,
  listCategories,
  listTodayTodos,
  recordAppOpen,
  rescheduleMistToToday,
  resetAllAppData,
  setSetting,
  uncompleteTodo,
  updateTodo,
} from '@/db/repositories';
import { selectDialogue } from '@/domain/pet/dialogue';
import { createId } from '@/lib/uuid';
import { SCORING } from '@/domain/gyeol/constants';
import { createFixedClock, setClock } from '@/lib/clock';
import type { TodoSomDatabase } from '@/db/databaseTypes';

describe('normalizeParams', () => {
  it('unwraps a single array argument', () => {
    expect(normalizeParams(['a', 1])).toEqual(['a', 1]);
  });

  it('passes variadic arguments through', () => {
    expect(normalizeParams('a', 1, null)).toEqual(['a', 1, null]);
  });

  it('handles empty array binding', () => {
    expect(normalizeParams([])).toEqual([]);
  });
});

describe('web database integration', () => {
  let db: TodoSomDatabase;
  const fixedNow = new Date('2026-06-14T12:00:00.000Z');

  beforeEach(async () => {
    resetDatabaseInstance();
    setClock(createFixedClock(fixedNow));
    db = await openDatabase();
  });

  afterEach(() => {
    resetDatabaseInstance();
    setClock(null);
  });

  it('runs seed -> listCategories -> createTodo -> completeTodo', async () => {
    const categories = await listCategories(db);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]?.name).toBe('오늘');

    const todo = await createTodo(db, { title: '테스트 할 일' });
    expect(todo.title).toBe('테스트 할 일');

    const result = await completeTodo(db, todo.id);
    expect(result.score.points).toBeGreaterThan(0);
    expect(result.hatched).toBe(true);
  });

  it('binds array params for category lookup by id', async () => {
    const learnCategory = await createCategory(db, { name: '공부', gyeolType: 'learn' });
    const todo = await createTodo(db, { title: '책 읽기', categoryId: learnCategory.id });
    const result = await completeTodo(db, todo.id);

    expect(result.score.gyeolType).toBe('learn');
  });
});

describe('return_after_absence dialogue', () => {
  let db: TodoSomDatabase;
  const fixedNow = new Date('2026-06-14T12:00:00.000Z');

  beforeEach(async () => {
    resetDatabaseInstance();
    setClock(createFixedClock(fixedNow));
    db = await openDatabase();
  });

  afterEach(() => {
    resetDatabaseInstance();
    setClock(null);
  });

  it('uses previous app open time before recordAppOpen updates it', async () => {
    await setSetting(db, 'last_app_open_at', '2026-06-10T12:00:00.000Z');
    const { previousLastOpenAt } = await recordAppOpen(db);

    const view = await buildPetRoomView(db, { previousLastOpenAt });
    expect(view.daysSinceLastVisit).toBeGreaterThanOrEqual(4);

    const entry = selectDialogue({
      lifeStage: view.pet.lifeStage,
      isFirstVisit: false,
      isOnboardingHatch: false,
      coreSeedJustCompleted: false,
      snackCountToday: view.snackCountToday,
      daysSinceLastVisit: view.daysSinceLastVisit,
      canEvolve: view.canEvolve,
    });
    expect(entry.condition).toBe('return_after_absence');
  });
});

describe('new journey evolution scope', () => {
  let db: TodoSomDatabase;
  const fixedNow = new Date('2026-06-14T12:00:00.000Z');

  beforeEach(async () => {
    resetDatabaseInstance();
    setClock(createFixedClock(fixedNow));
    db = await openDatabase();
  });

  afterEach(() => {
    resetDatabaseInstance();
    setClock(null);
  });

  it('does not count previous journey completions for a new pet', async () => {
    const createCategoryRow = await createCategory(db, { name: '창작', gyeolType: 'create' });

    for (let i = 0; i < SCORING.minCompletionCountForGrowth; i += 1) {
      const todo = await createTodo(db, {
        title: `이전 여정 ${i}`,
        categoryId: createCategoryRow.id,
      });
      await completeTodo(db, todo.id);
    }

    let petRow = await db.getFirstAsync<{ life_stage: string }>(
      `SELECT life_stage FROM pet_instances WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    );
    expect(petRow?.life_stage).toBe('baby');

    await db.runAsync(
      `UPDATE pet_instances SET life_stage = 'growth', primary_gyeol = 'create', updated_at = ? WHERE archived_at IS NULL`,
      [fixedNow.toISOString()],
    );

    const ts = fixedNow.toISOString();
    const newPetId = createId();
    const currentPet = await db.getFirstAsync<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM pet_instances WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    );
    await db.runAsync(
      `UPDATE pet_instances SET life_stage = 'archived', archived_at = ?, updated_at = ? WHERE id = ?`,
      [ts, ts, currentPet!.id],
    );
    await db.runAsync(
      `INSERT INTO pet_instances (
        id, user_id, species_id, name, life_stage, primary_gyeol, secondary_gyeol,
        affection, started_at, archived_at, created_at, updated_at
      ) VALUES (?, ?, 'som_mong', NULL, 'baby', NULL, NULL, 0, ?, NULL, ?, ?)`,
      [newPetId, currentPet!.user_id, ts, ts, ts],
    );

    const evolution = await evaluateAndApplyEvolution(db);
    expect(evolution).toBeNull();
  });
});

describe('todo CRUD', () => {
  let db: TodoSomDatabase;
  const fixedNow = new Date('2026-06-14T12:00:00.000Z');

  beforeEach(async () => {
    resetDatabaseInstance();
    setClock(createFixedClock(fixedNow));
    db = await openDatabase();
  });

  afterEach(() => {
    resetDatabaseInstance();
    setClock(null);
  });

  it('updates, uncompletes, and deletes a todo', async () => {
    const todo = await createTodo(db, { title: '원본' });
    await completeTodo(db, todo.id);

    await expect(updateTodo(db, todo.id, { title: '수정' })).rejects.toThrow();

    await uncompleteTodo(db, todo.id);
    const updated = await updateTodo(db, todo.id, { title: '수정됨' });
    expect(updated.title).toBe('수정됨');

    const today = await listTodayTodos(db);
    expect(today.some((t) => t.todo.id === todo.id && t.todo.status === 'open')).toBe(true);

    await deleteTodo(db, todo.id);
    const afterDelete = await listTodayTodos(db);
    expect(afterDelete.some((t) => t.todo.id === todo.id)).toBe(false);
  });

  it('reschedules mist todo to today', async () => {
    const todo = await createTodo(db, { title: '안개 씨앗', dueDate: '2026-06-13' });
    await db.runAsync(`UPDATE todos SET status = 'mist' WHERE id = ?`, [todo.id]);

    const rescheduled = await rescheduleMistToToday(db, todo.id);
    expect(rescheduled.status).toBe('open');
    expect(rescheduled.dueDate).toBe('2026-06-14');
  });

  it('deletes category and moves todos to fallback', async () => {
    const extra = await createCategory(db, { name: '운동', gyeolType: 'care' });
    const todo = await createTodo(db, { title: '런닝', categoryId: extra.id });

    await deleteCategory(db, extra.id);
    const categories = await listCategories(db);
    expect(categories.some((c) => c.id === extra.id)).toBe(false);

    const today = await listTodayTodos(db);
    const moved = today.find((t) => t.todo.id === todo.id);
    expect(moved?.category.id).not.toBe(extra.id);
  });

  it('blocks deleting the last category', async () => {
    const categories = await listCategories(db);
    await expect(deleteCategory(db, categories[0]!.id)).rejects.toBeInstanceOf(LastCategoryError);
  });

  it('returns evolution progress for baby pet', async () => {
    const todo = await createTodo(db, { title: '진화 테스트' });
    await completeTodo(db, todo.id);

    const progress = await getEvolutionProgress(db);
    expect(progress.lifeStage).toBe('baby');
    expect(progress.completionCount).toBeGreaterThanOrEqual(1);
    expect(progress.overallRatio).toBeGreaterThan(0);
  });

  it('resets all app data and re-seeds for onboarding', async () => {
    const todo = await createTodo(db, { title: '초기화 전' });
    await completeTodo(db, todo.id);
    await setSetting(db, 'onboarding_completed', 'true');

    await resetAllAppData(db);

    const categories = await listCategories(db);
    expect(categories).toHaveLength(1);
    expect(categories[0]?.name).toBe('오늘');

    const onboarding = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'onboarding_completed'",
    );
    expect(onboarding?.value).toBe('false');

    const today = await listTodayTodos(db);
    expect(today).toHaveLength(0);
  });
});
