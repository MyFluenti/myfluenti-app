import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme/tokens';

/** Casca das telas de entrada: fundo, área segura e teclado. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={authStyles.safe}>
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.screenPaddingX,
    gap: spacing.md,
  },
  form: { gap: spacing.lg, marginTop: spacing.lg },
  link: {
    alignSelf: 'center',
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
});
