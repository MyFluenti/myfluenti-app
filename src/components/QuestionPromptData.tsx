import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

import { Text } from './Text';

export type QuestionPromptDataProps = {
  /** question_type da questão (fill_blank, translation...). Outros tipos não renderizam nada. */
  questionType: string;
  /** prompt_data v1. Campos ausentes ou inválidos são ignorados. */
  promptData: unknown;
};

function field(data: unknown, key: string): string | undefined {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return undefined;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

const BLANK = '___';

export function QuestionPromptData({ questionType, promptData }: QuestionPromptDataProps) {
  if (questionType === 'fill_blank') {
    const sentence = field(promptData, 'sentence');
    const hint = field(promptData, 'blank_hint');
    if (!sentence && !hint) return null;
    const parts = sentence ? sentence.split(BLANK) : [];
    return (
      <View style={styles.root}>
        {sentence ? (
          <Text variant="heading3" accessibilityLabel={parts.join(' lacuna ')}>
            {parts.map((part, index) => (
              <Text key={index} variant="heading3">
                {part}
                {index < parts.length - 1 ? (
                  <Text variant="heading3" color="brandPrimaryLight" style={styles.blank}>
                    {' _____ '}
                  </Text>
                ) : null}
              </Text>
            ))}
          </Text>
        ) : null}
        {hint ? (
          <Text variant="caption" color="textSecondary">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }

  if (questionType === 'translation') {
    const text = field(promptData, 'text');
    if (!text) return null;
    return (
      <View style={styles.root}>
        <Text variant="label" color="textSecondary">
          Traduza
        </Text>
        <Text variant="heading3">{text}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  blank: { backgroundColor: colors.brandPrimarySubtle },
});
