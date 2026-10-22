import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import AppButton from './AppButton';

interface CameraPermissionGateProps {
  granted: boolean;
  canAskAgain: boolean;
  requesting?: boolean;
  onRequest: () => void;
}

export default function CameraPermissionGate({
  granted,
  canAskAgain,
  requesting = false,
  onRequest,
}: CameraPermissionGateProps) {
  const { colors } = useTheme();
  if (granted) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="camera-outline" size={40} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Permiso de cámara necesario</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        Para capturar una seña, la app necesita acceder a la cámara. Las fotos se envían al
        backend para su análisis y no se almacenan en el dispositivo.
      </Text>
      {canAskAgain ? (
        <AppButton
          label="Permitir cámara"
          icon="camera-outline"
          onPress={onRequest}
          loading={requesting}
        />
      ) : (
        <AppButton
          label="Abrir configuración"
          icon="settings-outline"
          onPress={() => void Linking.openSettings()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
