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
  { bg: string; border: string; indicator: ColorToken; suffix: string }
> = {
  normal: { bg: colors.bgSurface, border: colors.borderDefault, indicator: 'textSecondary', suffix: '' },
  selected: {
    bg: colors.brandPrimarySubtle,
    border: colors.brandPrimary,
    indicator: 'brandPrimary',
    suffix: ', selecionada',
  },
  correct: {
    bg: colors.statusSuccessSubtle,
    border: colors.statusSuccess,
    indicator: 'statusSuccess',
    suffix: ', correta',
  },
  incorrect: {
    bg: colors.statusErrorSubtle,
    border: colors.statusError,
    indicator: 'statusError',
    suffix: ', incorreta',
  },
};

const INDICATOR_SIZE = spacing.xl + spacing.xs; // 24

export function AnswerOption({ label, state = 'normal', onPress, disabled = false }: AnswerOptionProps) {
  const c = stateConfig[state];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}${c.suffix}`}
      accessibilityState={{ selected: state !== 'normal', checked: state !== 'normal', disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: c.bg, borderColor: c.border, opacity: pressed ? opacity.pressed : 1 },
      ]}
    >
      <View style={[styles.indicator, { borderColor: colors[c.indicator] }]}>
        {state === 'selected' && (
          <View style={[styles.dot, { backgroundColor: colors.brandPrimary }]} />
        )}
        {state === 'correct' && <Icon name="check" color="statusSuccess" size={spacing.lg} />}
        {state === 'incorrect' && <Icon name="close" color="statusError" size={spacing.lg} />}
      </View>
      <Text variant="bodyL" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.inputHeight,
    borderRadius: radius.md,
    borderWidth: layout.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.full,
  },
  label: { flex: 1 },
});
