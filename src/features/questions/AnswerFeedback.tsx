import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, layout, radius, spacing } from '@/theme/tokens';

export type AnswerFeedbackProps = {
  /** Correção devolvida pela RPC. O gabarito nunca vem para o app. */
  result: { is_correct: boolean; explanation: string | null };
};

/** Cartão de correção depois da resposta (revisão e aula). */
export function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const ok = result.is_correct;
  return (
    <View
      style={[styles.card, ok ? styles.success : styles.error]}
      accessibilityLiveRegion="polite"
    >
      <Text variant="heading3" color={ok ? 'statusSuccess' : 'statusError'}>
        {ok ? (result.explanation ? 'Certo! Veja por quê' : 'Certo!') : 'Incorreto'}
      </Text>
      {result.explanation ? (
        <Text variant="bodyM" color="textPrimary">
          {result.explanation}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: layout.borderWidth,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  success: {
    backgroundColor: colors.statusSuccessSubtle,
    borderColor: colors.statusSuccess,
  },
  error: {
    backgroundColor: colors.statusErrorSubtle,
    borderColor: colors.statusError,
  },
});
