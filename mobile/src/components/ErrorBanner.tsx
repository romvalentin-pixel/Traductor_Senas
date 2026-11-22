import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface ErrorBannerProps {
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorBanner({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorBannerProps) {
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: `${colors.danger}18`, borderColor: colors.danger }]}
    >
      <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
      <View style={styles.body}>
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
            <Text style={[styles.retry, { color: colors.danger }]}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  body: { flex: 1, gap: spacing.xs },
  message: { fontSize: 14, lineHeight: 20 },
  retry: { fontSize: 13, fontWeight: '700' },
});
