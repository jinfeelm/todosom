import { describe, expect, it } from 'vitest';
import { validateAllDialogueCopy, containsGuiltCopy } from '@/domain/pet/dialogue';
import { SCORING } from '@/domain/gyeol/constants';

describe('Phase 0 QA invariants', () => {
  it('has no guilt copy in dialogue', () => {
    expect(validateAllDialogueCopy()).toEqual([]);
  });

  it('enforces core seed limit of 3', () => {
    expect(SCORING.maxCoreSeedsPerDay).toBe(3);
  });

  it('rejects common guilt phrases', () => {
    expect(containsGuiltCopy('오늘은 하나만 다시 밝혀볼까요?')).toBe(false);
    expect(containsGuiltCopy('연속 기록이 깨졌습니다')).toBe(true);
    expect(containsGuiltCopy('실패했습니다')).toBe(true);
  });
});
