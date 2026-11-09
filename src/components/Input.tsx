import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, layout, radius, spacing, typography } from '@/theme/tokens';

import { Icon } from './icons';
import { Text } from './Text';

export type InputType = 'text' | 'email' | 'password';

export type InputProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  /** text (padrão), email (teclado e autocompletar de e-mail) ou password. */
  type?: InputType;
  /** Mensagem de erro em texto (não depende só da borda). */
  error?: string;
  /** Só para showcase e testes visuais: força a aparência de foco. */
  forceFocused?: boolean;
};

export function Input({
  label,
  type = 'text',
  error,
  forceFocused = false,
  value,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password' || secureTextEntry === true;
  const hidden = isPassword && !revealed;
  const isFocused = focused || forceFocused;
  // empty | focused | filled
  const borderColor = error
    ? colors.statusError
    : isFocused
      ? colors.brandPrimary
      : value
        ? colors.textSecondary
        : colors.borderDefault;

  const typeProps: TextInputProps =
    type === 'email'
      ? {
          keyboardType: 'email-address',
          autoComplete: 'email',
          textContentType: 'emailAddress',
          autoCapitalize: 'none',
          autoCorrect: false,
        }
      : type === 'password'
        ? {
            autoComplete: 'password',
            textContentType: 'password',
            autoCapitalize: 'none',
            autoCorrect: false,
          }
        : {};

  return (
    <View style={styles.wrapper}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.field, { borderColor }]}>
        <TextInput
          {...typeProps}
          {...rest}
          value={value}
          secureTextEntry={hidden}
          accessibilityLabel={error ? `${label}. ${error}` : label}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.brandPrimary}
          cursorColor={colors.brandPrimary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setRevealed((r) => !r)}
            hitSlop={spacing.sm}
            style={styles.toggle}
          >
            <Text variant="label" color="brandPrimaryLight">
              {revealed ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Icon name="close" color="statusError" size={spacing.lg} />
          <Text variant="caption" color="statusError" style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    minHeight: layout.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    color: colors.textPrimary,
    fontFamily: typography.bodyL.fontFamily,
    fontSize: typography.bodyL.fontSize,
    paddingVertical: 0,
  },
  toggle: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1 },
});
