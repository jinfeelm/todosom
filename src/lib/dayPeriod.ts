export type DayPeriod = 'morning' | 'afternoon' | 'night';

export function getDayPeriod(date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon';
  }
  return 'night';
}

export function getDayPeriodLabel(period: DayPeriod): string {
  switch (period) {
    case 'morning':
      return '아침';
    case 'afternoon':
      return '낮';
    case 'night':
      return '밤';
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}
