import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, layout, radius, spacing } from '@/theme/tokens';

import { Button } from './Button';
import { Text } from './Text';

export type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Ação recomendada (ex.: "Continuar teste"): fecha a folha e fica na tela. */
  primaryLabel: string;
  /** Ação secundária (ex.: "Sair"). */
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
};

/**
 * Folha inferior de confirmação (telas 33 e 34). Tocar fora, o voltar do Android ou a
 * ação primária fecham a folha sem sair. Respeita "reduzir movimento" (sem deslizar) e
 * leva o foco do leitor de tela para o título ao abrir.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const titleRef = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    if (!visible) return;
    // Espera a folha montar antes de mover o foco.
    const id = setTimeout(() => {
      const node = titleRef.current;
      if (!node) return;
      if (Platform.OS === 'web') (node as unknown as { focus?: () => void }).focus?.();
      else AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
    }, 50);
    return () => clearTimeout(id);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onPrimary}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPrimary}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
        />
        <View
          style={[styles.sheet, { paddingBottom: spacing['2xl'] + insets.bottom }]}
          // O Modal já é o diálogo na web; no iOS isto prende o leitor de tela na folha.
          accessibilityViewIsModal
        >
          <View style={styles.handle} aria-hidden />
          <View ref={titleRef} accessible accessibilityRole="header" focusable tabIndex={-1}>
            <Text variant="heading2">{title}</Text>
          </View>
          <Text variant="bodyM" color="textSecondary">
            {message}
          </Text>
          <View style={styles.actions}>
            <Button label={primaryLabel} onPress={onPrimary} />
            <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderColor: colors.borderDefault,
    borderWidth: layout.borderWidth,
    borderBottomWidth: 0,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: layout.sheetHandleWidth,
    height: layout.sheetHandleHeight,
    borderRadius: radius.full,
    backgroundColor: colors.borderDefault,
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.md, marginTop: spacing.md },
});
