import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getBreakpoint,
  getFabBottom,
  getHorizontalPadding,
  getMiniPetSize,
  getPetDisplaySize,
  getScrollBottomPadding,
  getToastBottom,
  LAYOUT,
} from '@/theme/layout';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      width,
      height,
      insets,
      breakpoint: getBreakpoint(width),
      horizontalPadding: getHorizontalPadding(width),
      contentWidth: Math.min(width - getHorizontalPadding(width) * 2, 480),
      petSize: getPetDisplaySize(width),
      miniPetSize: getMiniPetSize(width),
      fabBottom: getFabBottom(insets.bottom),
      scrollBottomPadding: getScrollBottomPadding(insets.bottom),
      toastBottom: getToastBottom(insets.bottom),
      tabBarHeight: LAYOUT.tabBarHeight + insets.bottom,
    }),
    [width, height, insets],
  );
}
