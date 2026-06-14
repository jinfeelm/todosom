export type LayoutBreakpoint = 'compact' | 'regular' | 'large';

export const LAYOUT = {
  contentMaxWidth: 480,
  tabBarHeight: 58,
  tabBarPaddingTop: 4,
  fabHeight: 48,
  toastOffset: 100,
  minTouchTarget: 44,
} as const;

export function getBreakpoint(width: number): LayoutBreakpoint {
  if (width < 375) {
    return 'compact';
  }
  if (width <= 428) {
    return 'regular';
  }
  return 'large';
}

export function getHorizontalPadding(width: number): number {
  const bp = getBreakpoint(width);
  if (bp === 'compact') {
    return 12;
  }
  if (bp === 'regular') {
    return 16;
  }
  return 20;
}

export function getPetDisplaySize(width: number): number {
  const raw = Math.floor(width * 0.55);
  return Math.min(Math.max(raw, 160), 320);
}

export function getMiniPetSize(width: number): number {
  const bp = getBreakpoint(width);
  if (bp === 'compact') {
    return 56;
  }
  return 64;
}

export function getScrollBottomPadding(
  safeBottom: number,
  tabBarHeight = LAYOUT.tabBarHeight,
  extra = 16,
): number {
  return safeBottom + tabBarHeight + LAYOUT.fabHeight + extra;
}

export function getFabBottom(safeBottom: number, extra = 8): number {
  return safeBottom + LAYOUT.tabBarHeight + extra;
}

export function getToastBottom(safeBottom: number): number {
  return safeBottom + LAYOUT.tabBarHeight + LAYOUT.fabHeight + 16;
}
