import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  label: { fontSize: 14 },
});
