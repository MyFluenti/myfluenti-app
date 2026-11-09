import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, opacity, radius, spacing, type ColorToken } from '@/theme/tokens';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Mostra indicador e ignora toques. */
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

type Palette = { bg: string; bgPressed: string; border: string; text: ColorToken };

const palettes: Record<ButtonVariant | 'disabled', Palette> = {
  primary: {
    bg: colors.brandPrimary,
    bgPressed: colors.brandPrimaryLight,
    border: colors.brandPrimary,
    text: 'textOnPrimary',
  },
  secondary: {
    bg: colors.bgElevated,
    bgPressed: colors.borderDefault,
    border: colors.bgElevated,
    text: 'textPrimary',
  },
  outline: {
    bg: 'transparent',
    bgPressed: colors.brandPrimarySubtle,
    border: colors.brandPrimary,
    text: 'brandPrimaryLight',
  },
  disabled: {
    bg: colors.bgSurface,
    bgPressed: colors.bgSurface,
    border: colors.borderDefault,
    text: 'textSecondary',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = disabled ? palettes.disabled : palettes[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          opacity: pressed ? opacity.pressed : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[palette.text]} />
      ) : (
        <Text variant="button" color={palette.text} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: layout.buttonHeight,
    minHeight: layout.minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
