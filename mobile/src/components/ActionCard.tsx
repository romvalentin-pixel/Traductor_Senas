import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface ActionCardProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}

export default function ActionCard({ icon, title, description, onPress }: ActionCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${colors.primary}18` }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18 },
});
