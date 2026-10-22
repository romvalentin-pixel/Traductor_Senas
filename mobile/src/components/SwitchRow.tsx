import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface SwitchRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function SwitchRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
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
});
