import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing, type ColorToken } from '@/theme/tokens';

import { Icon } from './icons';
import { Text } from './Text';

export type AnswerOptionState = 'normal' | 'selected' | 'correct' | 'incorrect';

export type AnswerOptionProps = {
  label: string;
  state?: AnswerOptionState;
  onPress?: () => void;
  /** Use depois que a RPC respondeu, para não permitir nova escolha. */
  disabled?: boolean;
};

const stateConfig: Record<
  AnswerOptionState,
  { bg: string; border: string; dot: string | null; mark: ColorToken | null; suffix: string }
> = {
  normal: {
    bg: colors.bgSurface,
    border: colors.borderDefault,
    dot: null,
    mark: null,
    suffix: '',
  },
  selected: {
    bg: colors.brandPrimarySubtle,
    border: colors.brandPrimary,
    dot: colors.brandPrimary,
    mark: null,
    suffix: 'selecionada',
  },
  correct: {
    bg: colors.statusSuccessSubtle,
    border: colors.statusSuccess,
    dot: colors.statusSuccess,
    mark: 'statusSuccess',
    suffix: 'correta',
  },
  incorrect: {
    bg: colors.statusErrorSubtle,
    border: colors.statusError,
    dot: colors.statusError,
    mark: 'statusError',
    suffix: 'incorreta',
  },
};

export function AnswerOption({ label, state = 'normal', onPress, disabled = false }: AnswerOptionProps) {
  const c = stateConfig[state];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={c.suffix ? `${label}, ${c.suffix}` : label}
      accessibilityState={{ selected: state !== 'normal', checked: state !== 'normal', disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: state === 'normal' ? layout.borderWidth : layout.borderWidthStrong,
          opacity: pressed ? opacity.pressed : 1,
        },
      ]}
    >
      <View
        style={[
          styles.indicator,
          c.dot ? { backgroundColor: c.dot, borderColor: c.dot } : { borderColor: colors.borderDefault },
        ]}
      />
      <Text variant="bodyL" style={styles.label}>
        {label}
      </Text>
      {/* A marca ✓/✕ garante que acerto e erro não dependam só de cor. */}
      {c.mark ? <Icon name={state === 'correct' ? 'check' : 'close'} color={c.mark} size={spacing.lg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.inputHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indicator: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.full,
    borderWidth: layout.borderWidthStrong,
  },
  label: { flex: 1 },
});
