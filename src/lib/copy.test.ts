import { describe, expect, it } from 'vitest';
import { containsGuiltCopy } from '@/domain/pet/dialogue';
import { copy } from '@/lib/copy';

const GUILT_PHRASES = ['실패', '왜 안 했', '연속 기록이 깨졌', '벌점', '죽었', '사망'];

function collectUiStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (typeof value === 'function') {
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      collectUiStrings(v, acc);
    }
  }
  return acc;
}

describe('copy', () => {
  it('has no guilt copy in UI strings', () => {
    const strings = collectUiStrings(copy);
    for (const text of strings) {
      expect(containsGuiltCopy(text)).toBe(false);
      for (const phrase of GUILT_PHRASES) {
        expect(text).not.toContain(phrase);
      }
    }
  });

  it('keeps subheadings concise', () => {
    const longStrings = collectUiStrings(copy).filter((s) => s.length > 40);
    expect(longStrings).toEqual([]);
  });
});
