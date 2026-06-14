import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GyeolType } from '@/domain/gyeol/types';
import { colors } from '@/theme';

interface CompletionEffectProps {
  gyeolType: GyeolType;
}

export function CompletionEffect({ gyeolType }: CompletionEffectProps) {
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View
        style={[
          styles.glow,
          { backgroundColor: colors.gyeol[gyeolType], opacity: 0.35 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
