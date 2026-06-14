import { describe, expect, it } from 'vitest';
import {
  containsGuiltCopy,
  DIALOGUE_ENTRIES,
  selectDialogue,
  validateAllDialogueCopy,
} from '@/domain/pet/dialogue';

describe('dialogue', () => {
  it('selects return dialogue after absence', () => {
    const entry = selectDialogue({
      lifeStage: 'baby',
      isFirstVisit: false,
      isOnboardingHatch: false,
      coreSeedJustCompleted: false,
      snackCountToday: 0,
      daysSinceLastVisit: 3,
      canEvolve: false,
    });
    expect(entry.condition).toBe('return_after_absence');
  });

  it('has no guilt copy in any dialogue entry', () => {
    expect(validateAllDialogueCopy()).toEqual([]);
    for (const entry of DIALOGUE_ENTRIES) {
      expect(containsGuiltCopy(entry.text)).toBe(false);
    }
  });

  it('selects evolution ready dialogue', () => {
    const entry = selectDialogue({
      lifeStage: 'baby',
      isFirstVisit: false,
      isOnboardingHatch: false,
      coreSeedJustCompleted: false,
      snackCountToday: 0,
      daysSinceLastVisit: 0,
      canEvolve: true,
    });
    expect(entry.condition).toBe('evolution_ready');
  });
});
