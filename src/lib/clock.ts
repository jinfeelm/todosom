export interface Clock {
  now(): Date;
  todayDateString(): string;
}

let clockOverride: Clock | null = null;

const defaultClock: Clock = {
  now: () => new Date(),
  todayDateString: () => {
    const d = new Date();
    return formatDateString(d);
  },
};

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getClock(): Clock {
  return clockOverride ?? defaultClock;
}

export function setClock(clock: Clock | null): void {
  clockOverride = clock;
}

export function createFixedClock(fixedDate: Date): Clock {
  return {
    now: () => new Date(fixedDate),
    todayDateString: () => formatDateString(fixedDate),
  };
}

export function diffDays(startIso: string, end: Date): number {
  const start = new Date(startIso);
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endDay - startDay) / (1000 * 60 * 60 * 24));
}
