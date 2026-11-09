import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme/tokens';

export type TextVariant = TypographyVariant;

export type TextProps = RNTextProps & {
  /** Estilo tipográfico (tokens). Padrão: bodyM. */
  variant?: TextVariant;
  /** Nome do token de cor. Padrão: textPrimary. */
  color?: ColorToken;
};

export function Text({ variant = 'bodyM', color = 'textPrimary', style, ...rest }: TextProps) {
  return <RNText {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
