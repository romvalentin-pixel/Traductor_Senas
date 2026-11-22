import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { spacing } from '../../constants/theme';
import { resetPassword } from '../../services/auth';
import { useTheme } from '../../hooks/useTheme';
import type { AuthStackParamList } from '../../types/navigation';
import { getErrorMessage } from '../../utils/errors';
import { hasErrors, validateResetPasswordForm } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;
type ResetErrors = { token?: string; password?: string; confirm?: string };

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<ResetErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nextErrors = validateResetPasswordForm(token, password, confirm);
    setErrors(nextErrors);
    setServerError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      Alert.alert('Contraseña actualizada', result.message, [
        { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware edges={['bottom']} contentStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>Nueva contraseña</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Pegá el código de recuperación y elegí una nueva contraseña.
        </Text>

        <ErrorBanner message={serverError} />

        <TextField
          label="Código de recuperación"
          icon="key-outline"
          value={token}
          onChangeText={setToken}
          error={errors.token}
          placeholder="Código recibido"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Nueva contraseña"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
        />
        <TextField
          label="Confirmar contraseña"
          icon="shield-checkmark-outline"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          placeholder="Repetí la contraseña"
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        <AppButton
          label="Actualizar contraseña"
          icon="checkmark-circle-outline"
          onPress={() => void submit()}
          loading={loading}
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
});
