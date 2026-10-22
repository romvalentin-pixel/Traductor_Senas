import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface SettingRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

export default function SettingRow({
  icon,
  label,
  description,
  value,
  right,
  onPress,
  destructive = false,
}: SettingRowProps) {
  const { colors } = useTheme();
  const color = destructive ? colors.danger : colors.text;

  const content = (
    <>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: destructive ? `${colors.danger}18` : colors.surfaceAlt },
        ]}
      >
        <Ionicons name={icon} size={19} color={destructive ? colors.danger : colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      {right ?? (value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null)}
      {onPress && !right ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 54,
    paddingVertical: spacing.xs,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  body: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 12, lineHeight: 17 },
  value: { fontSize: 13 },
});
