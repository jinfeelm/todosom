import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { getHorizontalPadding } from '@/theme/layout';
import { useWindowDimensions } from 'react-native';

interface SafeScreenProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
  padded?: boolean;
}

export function SafeScreen({
  children,
  edges = ['top', 'bottom'],
  style,
  padded = true,
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View
      style={[
        styles.root,
        edges.includes('top') ? { paddingTop: insets.top } : null,
        edges.includes('bottom') ? { paddingBottom: insets.bottom } : null,
        padded ? { paddingHorizontal: getHorizontalPadding(width) } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
