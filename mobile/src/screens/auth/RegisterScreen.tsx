import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { AuthStackParamList } from '../../types/navigation';
import { getErrorMessage } from '../../utils/errors';
import { hasErrors, validateRegisterForm, type FieldErrors } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nextErrors = validateRegisterForm(nombre, email, password, confirm);
    setErrors(nextErrors);
    setServerError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await register({ nombre, email, password });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Registrate para guardar tu historial de traducciones.
        </Text>
      </View>

      <Card style={styles.card}>
        <ErrorBanner message={serverError} />

        <TextField
          label="Nombre"
          icon="person-outline"
          value={nombre}
          onChangeText={setNombre}
          error={errors.nombre}
          placeholder="Tu nombre"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
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
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label="Contraseña"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint="Mínimo 6 caracteres."
          placeholder="Creá una contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <TextField
          label="Repetir contraseña"
          icon="lock-closed-outline"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          placeholder="Repetí la contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        <AppButton
          label="Crear cuenta"
          icon="checkmark-circle-outline"
          onPress={() => void submit()}
          loading={loading}
          fullWidth
        />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>¿Ya tenés cuenta?</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.link, { color: colors.primary }]}>Iniciar sesión</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xl },
  header: { gap: spacing.xs },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21 },
  card: { gap: spacing.md },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '700' },
});
