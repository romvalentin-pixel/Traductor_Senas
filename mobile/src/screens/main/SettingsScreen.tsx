import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Screen from '../../components/Screen';
import SectionTitle from '../../components/SectionTitle';
import SettingRow from '../../components/SettingRow';
import SwitchRow from '../../components/SwitchRow';
import { API_BASE_URL, APP_INFO, LANGUAGES } from '../../constants/config';
import { spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../constants/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
];

const RATE_OPTIONS = [
  { value: 0.75, label: 'Lenta' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: 'Rápida' },
  { value: 1.5, label: 'Muy rápida' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const {
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    autosave,
    setAutosave,
    autoSpeak,
    setAutoSpeak,
    themeMode,
    setThemeMode,
  } = useSettings();
  const { speak, stop, isSpeaking } = useSpeech();
  const [loggingOut, setLoggingOut] = useState(false);

  function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          setLoggingOut(true);
          void logout().finally(() => setLoggingOut(false));
        },
      },
    ]);
  }

  function testVoice() {
    if (isSpeaking) {
      void stop();
      return;
    }
    speak('Hola. Esta es una prueba de la voz del traductor de lengua de señas.');
  }

  return (
    <Screen>
      <SectionTitle title="Cuenta" />
      <Card>
        <SettingRow
          icon="person-circle-outline"
          label={user?.nombre ?? 'Usuario'}
          description={user?.email}
        />
      </Card>

      <SectionTitle
        title="Voz y traducción"
        subtitle="Se aplica a las traducciones nuevas y a la reproducción de voz."
      />
      <Card style={styles.card}>
        <Text style={[styles.label, { color: colors.text }]}>Idioma de la voz</Text>
        <View style={styles.chips}>
          {LANGUAGES.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={language === option.value}
              onPress={() => setLanguage(option.value)}
            />
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.label, { color: colors.text }]}>Velocidad de la voz</Text>
        <View style={styles.chips}>
          {RATE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={Math.abs(speechRate - option.value) < 0.01}
              onPress={() => setSpeechRate(option.value)}
            />
          ))}
        </View>
        <AppButton
          label={isSpeaking ? 'Detener prueba' : 'Probar voz'}
          icon={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'}
          variant="secondary"
          onPress={testVoice}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SwitchRow
          icon="volume-high-outline"
          label="Reproducción automática"
          description={
            autoSpeak
              ? 'Cuando se detecta una seña, la app la pronuncia automáticamente.'
              : 'La traducción solo se pronuncia cuando tocás el botón Escuchar.'
          }
          value={autoSpeak}
          onValueChange={setAutoSpeak}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SwitchRow
          icon="bookmark-outline"
          label="Guardado automático"
          description={
            autosave
              ? 'Las traducciones con confianza suficiente se guardan solas.'
              : 'Cada traducción debe guardarse manualmente.'
          }
          value={autosave}
          onValueChange={setAutosave}
        />
      </Card>

      <SectionTitle title="Apariencia" />
      <Card style={styles.card}>
        <Text style={[styles.label, { color: colors.text }]}>Tema</Text>
        <View style={styles.chips}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={themeMode === option.value}
              onPress={() => setThemeMode(option.value)}
            />
          ))}
        </View>
        <Text style={[styles.help, { color: colors.textMuted }]}>
          “Sistema” sigue el modo claro u oscuro configurado en el teléfono.
        </Text>
      </Card>

      <SectionTitle title="Aplicación" />
      <Card style={styles.card}>
        <SettingRow
          icon="server-outline"
          label="Servidor de la API"
          description={API_BASE_URL}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="information-circle-outline" label="Versión" value={APP_INFO.version} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="shield-checkmark-outline"
          label="Privacidad"
          description="Las fotos se envían al backend para su análisis y no se almacenan en el dispositivo."
        />
      </Card>

      <Card style={styles.about}>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>{APP_INFO.name}</Text>
        <Text style={[styles.help, { color: colors.textMuted }]}>{APP_INFO.description}</Text>
        <Text style={[styles.help, { color: colors.textMuted }]}>
          Proyecto académico. El modelo demo no reemplaza un modelo entrenado con señas reales.
        </Text>
      </Card>

      <AppButton
        label="Cerrar sesión"
        icon="log-out-outline"
        variant="danger"
        onPress={confirmLogout}
        loading={loggingOut}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  label: { fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: { height: 1, width: '100%' },
  help: { fontSize: 12, lineHeight: 18 },
  about: { gap: spacing.sm },
  aboutTitle: { fontSize: 16, fontWeight: '700' },
});
