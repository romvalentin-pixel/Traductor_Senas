import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Prediction } from '../types/api';
import { confidencePercent, confidenceTone, formatSignName } from '../utils/format';
import AppButton from './AppButton';
import Badge from './Badge';
import Card from './Card';
import ConfidenceBar from './ConfidenceBar';

interface SignResultCardProps {
  prediction: Prediction;
  onSpeak: () => void;
  onSave: () => void;
  isSpeaking?: boolean;
  saving?: boolean;
  saved?: boolean;
  lowConfidence?: boolean;
}

export default function SignResultCard({
  prediction,
  onSpeak,
  onSave,
  isSpeaking = false,
  saving = false,
  saved = false,
  lowConfidence = false,
}: SignResultCardProps) {
  const { colors } = useTheme();
  const tone = confidenceTone(prediction.confidence);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.caption, { color: colors.textMuted }]}>Seña detectada</Text>
          <Text style={[styles.sign, { color: colors.text }]}>
            {formatSignName(prediction.sign)}
          </Text>
        </View>
        <Badge
          label={`${confidencePercent(prediction.confidence)}%`}
          tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger'}
        />
      </View>

      <View style={[styles.translationBox, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.caption, { color: colors.textMuted }]}>Traducción</Text>
        <Text style={[styles.translation, { color: colors.text }]}>
          {prediction.translated_text}
        </Text>
      </View>

      <ConfidenceBar confidence={prediction.confidence} />

      {lowConfidence ? (
        <Text style={[styles.warning, { color: colors.warning }]}>
          Confianza baja: la seña puede ser incorrecta. Probá con mejor luz y la mano completa
          dentro del encuadre.
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Modelo: {prediction.model}</Text>
        {prediction.processing_time_ms !== undefined ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {Math.round(prediction.processing_time_ms)} ms
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <AppButton
          label={isSpeaking ? 'Detener voz' : 'Escuchar'}
          icon={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'}
          onPress={onSpeak}
          variant="secondary"
          style={styles.action}
        />
        <AppButton
          label={saved ? 'Guardada' : 'Guardar'}
          icon={saved ? 'checkmark-circle-outline' : 'bookmark-outline'}
          onPress={onSave}
          loading={saving}
          disabled={saved}
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  caption: { fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
  sign: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  translationBox: { borderRadius: 12, gap: 4, padding: spacing.md },
  translation: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  warning: { fontSize: 12, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
