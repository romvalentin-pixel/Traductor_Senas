import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ActionCard from '../../components/ActionCard';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingState from '../../components/LoadingState';
import Screen from '../../components/Screen';
import SectionTitle from '../../components/SectionTitle';
import StatCard from '../../components/StatCard';
import { spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { aiInfo, listSigns } from '../../services/ai';
import { getHistory } from '../../services/translations';
import type { AIInfo } from '../../types/api';
import type { MainTabParamList } from '../../types/navigation';
import { getErrorMessage } from '../../utils/errors';

type Props = BottomTabScreenProps<MainTabParamList, 'Inicio'>;

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [info, setInfo] = useState<AIInfo | null>(null);
  const [signCount, setSignCount] = useState<number | null>(null);
  const [historyCount, setHistoryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [modelInfo, signs, history] = await Promise.all([
        aiInfo(),
        listSigns(),
        getHistory(200),
      ]);
      setInfo(modelInfo);
      setSignCount(signs.length);
      setHistoryCount(history.length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const firstName = user?.nombre.split(' ')[0] ?? 'usuario';
  const modelLabel = info?.model ? info.model.toUpperCase() : '—';

  const steps = [
    {
      icon: 'videocam-outline' as const,
      title: 'Capturá la seña',
      text: 'Usá la cámara o probá una seña de demostración.',
    },
    {
      icon: 'sparkles-outline' as const,
      title: 'La IA la clasifica',
      text: 'El backend procesa la imagen y devuelve la seña con su confianza.',
    },
    {
      icon: 'volume-high-outline' as const,
      title: 'Escuchá y guardá',
      text: 'Reproducí la traducción con voz y conservala en tu historial.',
    },
  ];

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: colors.textMuted }]}>Hola,</Text>
          <Text style={[styles.name, { color: colors.text }]}>{firstName}</Text>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="hand-left-outline" size={28} color={colors.primary} />
        </View>
      </View>

      <Text style={[styles.tagline, { color: colors.textMuted }]}>
        Traducí Lengua de Señas Argentina a texto y voz desde tu teléfono.
      </Text>

      <ErrorBanner message={error} onRetry={() => void load()} />

      {loading ? (
        <LoadingState label="Consultando el servidor…" />
      ) : (
        <View style={styles.statsRow}>
          <StatCard icon="layers-outline" value={String(signCount ?? '—')} label="Señas disponibles" />
          <StatCard icon="time-outline" value={String(historyCount ?? '—')} label="Traducciones guardadas" />
          <StatCard icon="hardware-chip-outline" value={modelLabel} label="Modelo activo" />
        </View>
      )}

      <SectionTitle title="Accesos rápidos" subtitle="Todo lo que necesitás, a un toque." />
      <View style={styles.actions}>
        <ActionCard
          icon="camera-outline"
          title="Traducir una seña"
          description="Cámara en vivo o seña de demostración."
          onPress={() => navigation.navigate('Traductor')}
        />
        <ActionCard
          icon="time-outline"
          title="Ver historial"
          description="Consultá y escuchá tus traducciones anteriores."
          onPress={() => navigation.navigate('Historial')}
        />
        <ActionCard
          icon="settings-outline"
          title="Configuración"
          description="Idioma, velocidad de voz y apariencia."
          onPress={() => navigation.navigate('Configuracion')}
        />
      </View>

      <SectionTitle title="Cómo funciona" />
      <Card style={styles.stepsCard}>
        {steps.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name={step.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {index + 1}. {step.title}
              </Text>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>{step.text}</Text>
            </View>
          </View>
        ))}
      </Card>

      {info?.model === 'demo' ? (
        <Card style={styles.notice}>
          <View style={styles.noticeHeader}>
            <Badge label="MODO DEMO" tone="warning" />
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
          </View>
          <Text style={[styles.noticeText, { color: colors.textMuted }]}>
            El modelo incluido se entrenó con plantillas sintéticas para validar el flujo
            completo. No reemplaza un modelo entrenado con señas reales; la precisión en uso
            real puede ser baja.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { gap: 2 },
  hello: { fontSize: 15 },
  name: { fontSize: 28, fontWeight: '800' },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  tagline: { fontSize: 14, lineHeight: 21, marginTop: -spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { gap: spacing.sm },
  stepsCard: { gap: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md },
  stepIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepText: { fontSize: 13, lineHeight: 19 },
  notice: { gap: spacing.sm },
  noticeHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  noticeText: { fontSize: 13, lineHeight: 19 },
});
