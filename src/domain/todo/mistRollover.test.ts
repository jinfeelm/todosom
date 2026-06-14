import { describe, expect, it } from 'vitest';
import { isMistEligibleTodo, shouldRolloverMist } from '@/domain/todo/mistRollover';

describe('mistRollover', () => {
  it('rolls over when never rolled before', () => {
    expect(shouldRolloverMist(null, '2026-06-14')).toBe(true);
  });

  it('skips rollover when already done today', () => {
    expect(shouldRolloverMist('2026-06-14', '2026-06-14')).toBe(false);
  });

  it('identifies open todos from past dates', () => {
    expect(isMistEligibleTodo('2026-06-13', 'open', '2026-06-14')).toBe(true);
    expect(isMistEligibleTodo('2026-06-14', 'open', '2026-06-14')).toBe(false);
    expect(isMistEligibleTodo('2026-06-13', 'completed', '2026-06-14')).toBe(false);
  });
});
