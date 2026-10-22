import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : 'transparent',
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
