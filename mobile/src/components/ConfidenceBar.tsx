import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { confidencePercent, confidenceTone } from '../utils/format';

interface ConfidenceBarProps {
  confidence: number;
  caption?: string;
}

export default function ConfidenceBar({ confidence, caption }: ConfidenceBarProps) {
  const { colors } = useTheme();
  const tone = confidenceTone(confidence);
  const color = colors[tone];
  const percent = confidencePercent(confidence);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {caption ?? 'Confianza del modelo'}
        </Text>
        <Text style={[styles.value, { color }]}>{percent}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12 },
  value: { fontSize: 13, fontWeight: '700' },
  track: { borderRadius: radius.pill, height: 8, overflow: 'hidden' },
  fill: { borderRadius: radius.pill, height: '100%' },
});
