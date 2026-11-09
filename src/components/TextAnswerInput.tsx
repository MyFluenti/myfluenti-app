import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { Input } from './Input';
import { QuestionPromptData } from './QuestionPromptData';

export type TextAnswerInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Opcionais: se informados, o enunciado (sentence ou text) aparece acima do campo. */
  questionType?: string;
  promptData?: unknown;
};

/** Campo de resposta para fill_blank e translation. */
export function TextAnswerInput({
  value,
  onChangeText,
  placeholder,
  disabled = false,
  accessibilityLabel,
  questionType,
  promptData,
}: TextAnswerInputProps) {
  return (
    <View style={styles.root}>
      {questionType ? <QuestionPromptData questionType={questionType} promptData={promptData} /> : null}
      <Input
        label="Sua resposta"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        accessibilityLabel={accessibilityLabel}
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
});
