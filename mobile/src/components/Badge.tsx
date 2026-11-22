import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export default function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    info: { bg: `${colors.primary}1F`, fg: colors.primary },
    success: { bg: `${colors.success}1F`, fg: colors.success },
    warning: { bg: `${colors.warning}1F`, fg: colors.warning },
    danger: { bg: `${colors.danger}1F`, fg: colors.danger },
  };
  const { bg, fg } = palette[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});
