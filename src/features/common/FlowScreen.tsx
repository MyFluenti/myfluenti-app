import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme/tokens';

export type FlowScreenProps = {
  /** Fica fixo no topo (título, progresso, fechar). */
  header?: ReactNode;
  children: ReactNode;
  /** Ações fixas no rodapé (sobe com o teclado). */
  footer?: ReactNode;
  /** Centraliza o conteúdo na vertical quando sobra espaço. */
  centered?: boolean;
};

/**
 * Casca das telas de fluxo em etapas (boas-vindas, autoavaliação, nivelamento):
 * cabeçalho fixo, conteúdo rolável e ações no rodapé, como nas telas 01, 02, 03, 14 e 16.
 */
export function FlowScreen({ header, children, footer, centered = false }: FlowScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={insets.top}>
        {header ? <View style={styles.header}>{header}</View> : null}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, centered && styles.centered]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  content: {
    flexGrow: 1,
    padding: layout.screenPaddingX,
    gap: spacing.lg,
  },
  centered: { justifyContent: 'center' },
  footer: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
