import { Ionicons } from '@expo/vector-icons';
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
import { hasErrors, validateLoginForm, type FieldErrors } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nextErrors = validateLoginForm(email, password);
    setErrors(nextErrors);
    setServerError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboardAware edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="hand-left-outline" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Traductor LSA</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Convertí Lengua de Señas Argentina en texto y voz.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Iniciar sesión</Text>

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
          returnKeyType="next"
        />
        <TextField
          label="Contraseña"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ForgotPassword')}
          hitSlop={8}
          style={styles.forgotWrap}
        >
          <Text style={[styles.forgotLink, { color: colors.primary }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>

        <AppButton
          label="Entrar"
          icon="arrow-forward"
          onPress={() => void submit()}
          loading={loading}
          fullWidth
        />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>¿No tenés cuenta?</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Register')}
          hitSlop={8}
        >
          <Text style={[styles.link, { color: colors.primary }]}>Crear una cuenta</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  logo: {
    alignItems: 'center',
    borderRadius: 38,
    height: 76,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 76,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  subtitle: { fontSize: 14, lineHeight: 21, maxWidth: 300, textAlign: 'center' },
  card: { gap: spacing.md },
  cardTitle: { fontSize: 19, fontWeight: '700' },
  forgotWrap: { alignSelf: 'flex-end' },
  forgotLink: { fontSize: 13, fontWeight: '600' },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '700' },
});
