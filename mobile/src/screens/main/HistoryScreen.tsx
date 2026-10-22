import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/EmptyState';
import ErrorBanner from '../../components/ErrorBanner';
import HistoryItem from '../../components/HistoryItem';
import LoadingState from '../../components/LoadingState';
import SectionTitle from '../../components/SectionTitle';
import { spacing } from '../../constants/theme';
import { useSpeech } from '../../hooks/useSpeech';
import { useTheme } from '../../hooks/useTheme';
import { useTranslationHistory } from '../../hooks/useTranslationHistory';
import type { Translation } from '../../types/api';
import type { MainTabParamList } from '../../types/navigation';
import { getErrorMessage } from '../../utils/errors';

type Props = BottomTabScreenProps<MainTabParamList, 'Historial'>;

export default function HistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { speak, stop } = useSpeech();
  const { items, loading, refreshing, error, load, remove } = useTranslationHistory();
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function confirmDelete(item: Translation) {
    Alert.alert(
      'Eliminar traducción',
      `Se eliminará “${item.translated_text}” del historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void remove(item.id)
              .then(() => setActionError(null))
              .catch((err) => setActionError(getErrorMessage(err)));
          },
        },
      ]
    );
  }

  function handleSpeak(item: Translation) {
    void stop();
    speak(item.translated_text);
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionTitle
              title="Historial"
              subtitle={
                items.length === 1
                  ? '1 traducción guardada'
                  : `${items.length} traducciones guardadas`
              }
            />
            <ErrorBanner
              message={actionError ?? error}
              onRetry={() => {
                setActionError(null);
                void load();
              }}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Cargando historial…" />
          ) : (
            <EmptyState
              icon="time-outline"
              title="Todavía no hay traducciones"
              message="Cuando guardes una seña traducida, va a aparecer acá para que puedas escucharla de nuevo."
              actionLabel="Traducir una seña"
              onAction={() => navigation.navigate('Traductor')}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          items.length > 0 ? (
            <Text style={[styles.footer, { color: colors.textMuted }]}>
              Deslizá hacia abajo para actualizar.
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <HistoryItem
            translation={item}
            onSpeak={() => handleSpeak(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  separator: { height: spacing.sm },
  footer: { fontSize: 11, paddingTop: spacing.lg, textAlign: 'center' },
});
