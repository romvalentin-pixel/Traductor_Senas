import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export default function TextField({
  label,
  error,
  hint,
  icon,
  secureTextEntry,
  style,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={19} color={colors.textMuted} /> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword ? hidden : false}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            hitSlop={10}
            onPress={() => setHidden((value) => !value)}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600' },
  inputRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  helper: { fontSize: 12 },
});
