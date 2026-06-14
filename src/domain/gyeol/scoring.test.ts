import { describe, expect, it } from 'vitest';
import { scoreTodoCompletion } from '@/domain/gyeol/scoring';
import type { Category, Todo } from '@/domain/gyeol/types';

const baseCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: '오늘',
  gyeolType: 'focus',
  color: '#6B8F71',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    userId: 'user-1',
    title: '테스트',
    categoryId: 'cat-1',
    dueDate: '2026-06-14',
    isCoreSeed: false,
    difficulty: 'normal',
    status: 'open',
    plannedAt: null,
    completedAt: null,
    createdAt: '2026-06-14T08:00:00.000Z',
    updatedAt: '2026-06-14T08:00:00.000Z',
    ...overrides,
  };
}

describe('scoreTodoCompletion', () => {
  it('gives higher points for core seed than normal completion', () => {
    const completedAt = new Date('2026-06-14T10:00:00.000Z');
    const normal = scoreTodoCompletion({
      todo: makeTodo(),
      category: baseCategory,
      completedAt,
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 0,
    });
    const core = scoreTodoCompletion({
      todo: makeTodo({ isCoreSeed: true }),
      category: baseCategory,
      completedAt,
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 0,
    });
    expect(core.points).toBeGreaterThan(normal.points);
    expect(core.rewardType).toBe('deep_evolution');
  });

  it('treats instant completion as snack', () => {
    const created = '2026-06-14T10:00:00.000Z';
    const result = scoreTodoCompletion({
      todo: makeTodo({ createdAt: created, updatedAt: created }),
      category: baseCategory,
      completedAt: new Date('2026-06-14T10:00:30.000Z'),
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 0,
    });
    expect(result.rewardType).toBe('snack');
    expect(result.reason).toContain('instant_completion');
  });

  it('applies category diminishing returns', () => {
    const completedAt = new Date('2026-06-14T10:00:00.000Z');
    const first = scoreTodoCompletion({
      todo: makeTodo(),
      category: baseCategory,
      completedAt,
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 0,
    });
    const fourth = scoreTodoCompletion({
      todo: makeTodo({ id: 'todo-2' }),
      category: baseCategory,
      completedAt,
      sameCategoryCompletionCountToday: 4,
      currentDailyEvolutionPoints: 0,
    });
    expect(fourth.points).toBeLessThan(first.points);
  });

  it('caps daily evolution points', () => {
    const result = scoreTodoCompletion({
      todo: makeTodo({ isCoreSeed: true, difficulty: 'deep' }),
      category: baseCategory,
      completedAt: new Date('2026-06-14T10:00:00.000Z'),
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 17,
    });
    expect(result.points).toBe(1);
  });

  it('applies recovery bonus for mist todos', () => {
    const result = scoreTodoCompletion({
      todo: makeTodo({ status: 'mist' }),
      category: baseCategory,
      completedAt: new Date('2026-06-14T10:00:00.000Z'),
      sameCategoryCompletionCountToday: 0,
      currentDailyEvolutionPoints: 0,
    });
    expect(result.rewardType).toBe('recovery');
  });
});
