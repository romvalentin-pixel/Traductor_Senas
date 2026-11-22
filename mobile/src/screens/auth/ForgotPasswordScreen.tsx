import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { spacing } from '../../constants/theme';
import { forgotPassword } from '../../services/auth';
import { useTheme } from '../../hooks/useTheme';
import type { AuthStackParamList } from '../../types/navigation';
import { getErrorMessage } from '../../utils/errors';
import { hasErrors, validateForgotPasswordForm, type FieldErrors } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nextErrors = validateForgotPasswordForm(email);
    setErrors(nextErrors);
    setServerError(null);
    setMessage(null);
    setDemoToken(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      setDemoToken(result.demo_reset_token ?? null);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware edges={['bottom']} contentStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>Recuperar acceso</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Ingresá tu email. Si la cuenta existe, generaremos un código de recuperación.
        </Text>

        <ErrorBanner message={serverError} />

        <TextField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        <AppButton
          label="Generar código"
          icon="key-outline"
          onPress={() => void submit()}
          loading={loading}
          fullWidth
        />

        {message ? (
          <View style={[styles.resultBox, { backgroundColor: `${colors.primary}12` }]}>
            <Text style={[styles.resultText, { color: colors.text }]}>{message}</Text>
          </View>
        ) : null}

        {demoToken ? (
          <View style={[styles.tokenBox, { borderColor: colors.border }]}>
            <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>
              Código de demostración (en producción se enviaría por correo):
            </Text>
            <Text selectable style={[styles.tokenValue, { color: colors.text }]}>
              {demoToken}
            </Text>
            <AppButton
              label="Usar este código"
              icon="arrow-forward"
              variant="secondary"
              onPress={() => navigation.navigate('ResetPassword', { token: demoToken })}
              fullWidth
            />
          </View>
        ) : null}

        <AppButton
          label="Ya tengo un código"
          variant="ghost"
          onPress={() => navigation.navigate('ResetPassword')}
          fullWidth
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.lg },
  card: { gap: spacing.md },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  resultBox: { borderRadius: 12, padding: spacing.md },
  resultText: { fontSize: 14, lineHeight: 20 },
  tokenBox: { borderRadius: 12, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  tokenLabel: { fontSize: 12, lineHeight: 17 },
  tokenValue: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
});
