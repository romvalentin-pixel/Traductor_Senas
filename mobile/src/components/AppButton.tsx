import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const { colors } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surfaceAlt
          : 'transparent';
  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? '#FFFFFF'
        : colors.text;
  const borderColor = variant === 'ghost' ? 'transparent' : colors.border;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: background,
          borderColor,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={textColor} /> : null}
          <Text
            style={[
              styles.label,
              { color: textColor, fontSize: size === 'sm' ? 13 : size === 'lg' ? 17 : 15 },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { minHeight: 38, paddingHorizontal: spacing.md },
  md: { minHeight: 48, paddingHorizontal: spacing.lg },
  lg: { minHeight: 54, paddingHorizontal: spacing.xl },
});
