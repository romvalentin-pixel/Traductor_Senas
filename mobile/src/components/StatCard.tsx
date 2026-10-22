import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface StatCardProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, lineHeight: 15 },
});
