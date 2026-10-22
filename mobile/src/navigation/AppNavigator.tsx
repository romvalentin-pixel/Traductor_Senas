import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_INFO } from '../constants/config';
import { spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types/navigation';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <Text style={[styles.splashTitle, { color: colors.text }]}>{APP_INFO.name}</Text>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.splashText, { color: colors.textMuted }]}>
        Verificando tu sesión…
      </Text>
    </View>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'authenticated' ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  const theme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  splashTitle: { fontSize: 26, fontWeight: '800' },
  splashText: { fontSize: 13 },
});
