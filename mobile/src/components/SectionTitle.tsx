import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function SectionTitle({ title, subtitle, right }: SectionTitleProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18 },
});
