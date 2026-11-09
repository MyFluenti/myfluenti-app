import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

import { Text } from './Text';

export type WordOrderAnswerProps = {
  /** Tokens na ordem recebida do backend (já embaralhados). Nunca são reordenados aqui. */
  tokens: string[];
  /** Frase montada, na ordem escolhida pelo aluno. */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

/** Texto enviado ao backend: { text: joinTokens(value) }. */
export function joinTokens(value: string[]): string {
  return value.join(' ');
}

/** Índices de `tokens` ainda disponíveis (por índice, então tokens repetidos funcionam). */
function availableIndexes(tokens: string[], value: string[]): number[] {
  const used = new Set<number>();
  for (const word of value) {
    const idx = tokens.findIndex((t, i) => t === word && !used.has(i));
    if (idx >= 0) used.add(idx);
  }
  return tokens.map((_, i) => i).filter((i) => !used.has(i));
}

export function WordOrderAnswer({ tokens, value, onChange, disabled = false }: WordOrderAnswerProps) {
  const available = availableIndexes(tokens, value);
  const sentence = joinTokens(value);
  const previous = useRef(sentence);

  useEffect(() => {
    if (previous.current === sentence) return;
    previous.current = sentence;
    AccessibilityInfo.announceForAccessibility(sentence ? `Frase: ${sentence}` : 'Frase vazia');
  }, [sentence]);

  return (
    <View style={styles.root}>
      <View
        style={styles.answerArea}
        accessibilityLiveRegion="polite"
        accessibilityLabel={sentence ? `Sua frase: ${sentence}` : 'Sua frase: vazia'}
      >
        {value.length === 0 ? (
          <Text variant="bodyM" color="textSecondary">
            Toque nas palavras para montar a frase
          </Text>
        ) : (
          value.map((word, position) => (
            <Chip
              key={`answer-${position}`}
              word={word}
              selected
              disabled={disabled}
              accessibilityLabel={`Remover palavra ${word}`}
              onPress={() => onChange(value.filter((_, i) => i !== position))}
            />
          ))
        )}
      </View>
      <View style={styles.bank}>
        {available.map((index) => (
          <Chip
            key={`token-${index}`}
            word={tokens[index] ?? ''}
            disabled={disabled}
            accessibilityLabel={`Adicionar palavra ${tokens[index] ?? ''}`}
            onPress={() => onChange([...value, tokens[index] ?? ''])}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  word,
  selected = false,
  disabled,
  accessibilityLabel,
  onPress,
}: {
  word: string;
  selected?: boolean;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        { opacity: pressed ? opacity.pressed : 1 },
      ]}
    >
      <Text variant="bodyL" color={selected ? 'brandPrimaryLight' : 'textPrimary'}>
        {word}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  answerArea: {
    minHeight: layout.inputHeight + spacing['2xl'],
    borderRadius: radius.md,
    borderWidth: layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: layout.borderWidth,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimarySubtle,
  },
});
