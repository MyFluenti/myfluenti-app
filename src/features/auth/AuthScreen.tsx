import { StyleSheet } from 'react-native';

import { KeyboardAwareScreen } from '@/features/common/KeyboardAwareScreen';
import { layout, spacing } from '@/theme/tokens';

/** Casca das telas de entrada: fundo, área segura, teclado e rolagem até o campo focado. */
export const AuthScreen = KeyboardAwareScreen;

export const authStyles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.lg },
  link: {
    alignSelf: 'center',
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
});
