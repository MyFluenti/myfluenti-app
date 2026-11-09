import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme/tokens';

// O RN 0.88 não exporta o tipo da instância do ScrollView: extraído da prop `ref`.
type ScrollHandle = NonNullable<ComponentProps<typeof ScrollView>['ref']> extends Ref<infer T>
  ? T
  : never;

type ViewHandle = NonNullable<ComponentProps<typeof View>['ref']> extends Ref<infer T> ? T : never;

const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

function log(...args: unknown[]) {
  if (__DEV__) console.log('[kbd]', ...args);
}

const ScrollIntoViewContext = createContext<() => void>(() => {});

/**
 * Handler para o `onFocus` de qualquer Input dentro de uma KeyboardAwareScreen:
 * rola só o necessário para o campo ficar visível acima do teclado.
 */
export function useScrollFocusedFieldIntoView(): () => void {
  return useContext(ScrollIntoViewContext);
}

/**
 * Casca para telas com campos de texto.
 *
 * Android (SDK 58) é edge-to-edge: a janela não encolhe com o teclado, então o
 * KeyboardAvoidingView com behavior="padding" (nas duas plataformas) é que encolhe a
 * ScrollView. O bloco de conteúdo tem minHeight = altura da ScrollView com o teclado
 * fechado e fica centralizado: ele não se move quando a área encolhe, só passa a caber
 * rolando. No foco, mede o campo relativo ao conteúdo (sem coordenadas de janela) e
 * rola só se ele estiver fora da parte visível.
 */
export function KeyboardAwareScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollHandle>(null);
  const contentRef = useRef<ViewHandle>(null);
  const scrollY = useRef(0);
  const visibleHeight = useRef(0);
  const keyboardOpen = useRef(false);
  const [restingHeight, setRestingHeight] = useState(0);

  const scrollFocusedFieldIntoView = useCallback(() => {
    const field = TextInput.State.currentlyFocusedInput();
    const content = contentRef.current;
    if (!keyboardOpen.current || !field || !content) return;
    field.measureLayout(
      content,
      (_x, y, _w, h) => {
        const top = y - spacing.lg;
        const bottom = y + h + spacing.lg;
        const visible = visibleHeight.current;
        let target: number | null = null;
        if (bottom > scrollY.current + visible) target = bottom - visible;
        else if (top < scrollY.current) target = Math.max(0, top);
        log('field y/h', Math.round(y), Math.round(h), 'scrollY', Math.round(scrollY.current),
          'visible', Math.round(visible), 'scrollTo', target === null ? 'none' : Math.round(target));
        if (target !== null) scrollRef.current?.scrollTo({ y: target, animated: true });
      },
      () => log('measureLayout failed'),
    );
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, () => {
      keyboardOpen.current = true;
      log('keyboard show');
      // A ScrollView encolhe no layout seguinte; o onLayout também tenta de novo.
      requestAnimationFrame(scrollFocusedFieldIntoView);
    });
    const hide = Keyboard.addListener(HIDE_EVENT, () => {
      keyboardOpen.current = false;
      log('keyboard hide');
      if (scrollY.current > 0) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollFocusedFieldIntoView]);

  const onFieldFocus = useCallback(() => {
    // Teclado já aberto (trocou de campo): o layout está assentado, mede direto.
    // Se ainda vai abrir, o evento de show e o onLayout cuidam disso.
    if (keyboardOpen.current) requestAnimationFrame(scrollFocusedFieldIntoView);
  }, [scrollFocusedFieldIntoView]);

  const onScrollViewLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    visibleHeight.current = h;
    // Só guarda a altura de repouso com o teclado fechado (a área encolhe quando abre).
    if (!keyboardOpen.current && !Keyboard.isVisible()) setRestingHeight(h);
    log('visibleHeight', Math.round(h), 'restingHeight', keyboardOpen.current ? 'kept' : Math.round(h));
    if (keyboardOpen.current) requestAnimationFrame(scrollFocusedFieldIntoView);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={insets.top}>
        <ScrollIntoViewContext.Provider value={onFieldFocus}>
          <ScrollView
            ref={scrollRef}
            onLayout={onScrollViewLayout}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
          >
            <View ref={contentRef} style={[styles.block, { minHeight: restingHeight }]}>
              {children}
            </View>
          </ScrollView>
        </ScrollIntoViewContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  block: {
    justifyContent: 'center',
    padding: layout.screenPaddingX,
    gap: spacing.md,
  },
});
