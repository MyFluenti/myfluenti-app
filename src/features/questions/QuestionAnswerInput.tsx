import { StyleSheet, View } from 'react-native';

import {
  AnswerOption,
  TextAnswerInput,
  WordOrderAnswer,
  type AnswerOptionState,
} from '@/components';
import { spacing } from '@/theme/tokens';

import { answerModeOf, wordOrderTokens, type AnswerDraft, type AnswerableQuestion } from './answer';

export type QuestionAnswerInputProps = {
  question: AnswerableQuestion;
  draft: AnswerDraft;
  onChange: (next: AnswerDraft) => void;
  disabled?: boolean;
  /**
   * Resultado devolvido pela RPC, quando houver. Só pinta a alternativa escolhida
   * (certa ou errada); a alternativa correta nunca é revelada.
   */
  result?: { is_correct: boolean } | null;
};

/**
 * Entrada da resposta por tipo de questão: alternativas, campo de texto (com a frase
 * de fill_blank ou o texto de translation) ou montagem de word_order.
 */
export function QuestionAnswerInput({
  question,
  draft,
  onChange,
  disabled = false,
  result = null,
}: QuestionAnswerInputProps) {
  const mode = answerModeOf(question);

  if (mode === 'word_order') {
    return (
      <WordOrderAnswer
        tokens={wordOrderTokens(question) ?? []}
        value={draft.tokens}
        onChange={(tokens) => onChange({ ...draft, tokens })}
        disabled={disabled}
      />
    );
  }

  if (mode === 'text') {
    return (
      <TextAnswerInput
        value={draft.text}
        onChangeText={(text) => onChange({ ...draft, text })}
        disabled={disabled}
        questionType={question.question_type}
        promptData={question.prompt_data}
      />
    );
  }

  return (
    <View style={styles.optionsList}>
      {question.options
        .slice()
        .sort((x, y) => x.position - y.position)
        .map((opt) => {
          const isSelected = draft.optionId === opt.id;
          let state: AnswerOptionState = 'normal';
          if (isSelected) {
            state = result ? (result.is_correct ? 'correct' : 'incorrect') : 'selected';
          }
          return (
            <AnswerOption
              key={opt.id}
              label={opt.text}
              state={state}
              disabled={disabled}
              onPress={() => onChange({ ...draft, optionId: opt.id })}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsList: { gap: spacing.md },
});
