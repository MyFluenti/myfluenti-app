import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type ColorToken } from '@/theme/tokens';

import { Text } from './Text';

export type BadgeVariant = 'free' | 'premium' | 'completed' | 'in_progress';

export type BadgeProps = {
  variant: BadgeVariant;
  /** Substitui o texto padrão. */
  label?: string;
};

const config: Record<BadgeVariant, { label: string; bg: string; text: ColorToken }> = {
  free: { label: 'Free', bg: colors.bgElevated, text: 'textSecondary' },
  premium: { label: 'Premium', bg: colors.brandPrimarySubtle, text: 'brandPrimaryLight' },
  completed: { label: 'Concluída', bg: colors.statusSuccessSubtle, text: 'statusSuccess' },
  in_progress: { label: 'Em andamento', bg: colors.brandPrimarySubtle, text: 'brandPrimaryLight' },
};

export function Badge({ variant, label }: BadgeProps) {
  const c = config[variant];
  const text = label ?? c.label;
  return (
    <View style={[styles.base, { backgroundColor: c.bg }]} accessible accessibilityLabel={text}>
      <Text variant="caption" color={c.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
