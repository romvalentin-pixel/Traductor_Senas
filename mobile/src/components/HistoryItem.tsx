import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Translation } from '../types/api';
import { confidenceTone, formatDate, formatSignName } from '../utils/format';
import Badge from './Badge';

interface HistoryItemProps {
  translation: Translation;
  onSpeak: () => void;
  onDelete: () => void;
}

export default function HistoryItem({ translation, onSpeak, onDelete }: HistoryItemProps) {
  const { colors } = useTheme();
  const tone = confidenceTone(translation.confidence);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sign, { color: colors.text }]}>
          {formatSignName(translation.sign_detected)}
        </Text>
        <Badge
          label={`${Math.round(translation.confidence * 100)}%`}
          tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger'}
        />
      </View>
      <Text style={[styles.translation, { color: colors.text }]}>
        {translation.translated_text}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {formatDate(translation.created_at)}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escuchar traducción"
            hitSlop={8}
            onPress={onSpeak}
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons name="volume-high-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar del historial"
            hitSlop={8}
            onPress={onDelete}
            style={[styles.actionButton, { backgroundColor: `${colors.danger}18` }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sign: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  translation: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    alignItems: 'center',
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
});
