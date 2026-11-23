import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { LogoMark, Text } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { colors, layout, radius, spacing } from '@/theme/tokens';

import {
  BALLOONS,
  BALLOON_IN,
  DESCRIPTION_IN,
  EASE_IN_OUT,
  EASE_OUT,
  GLOW_BREATHE,
  GLOW_IN,
  INTRO_TOTAL_MS,
  LOGO_IN,
  PRIMARY_BUTTON_IN,
  SECONDARY_BUTTON_IN,
  SLOGAN_IN,
  SPRING_BOUNCE_25,
  SPRING_BOUNCE_45,
  SPRING_BOUNCE_50,
  TITLE_IN,
  staggerDelay,
} from './constants';

type Spring = { damping: number; stiffness: number; mass: number };

/**
 * Entrada genérica: opacidade e deslocamento em Y (opcionalmente escala com mola). Só
 * `opacity` e `transform`, na thread de UI. Com `skip` ligado, vai direto ao estado final.
 */
function Reveal({
  skip,
  start,
  fadeMs,
  moveMs,
  fromY = 0,
  ySpring,
  fromScale,
  scaleSpring,
  float,
  children,
  style,
  pointerEvents,
}: {
  skip: SharedValue<number>;
  start: number;
  fadeMs: number;
  moveMs?: number;
  fromY?: number;
  ySpring?: Spring;
  fromScale?: number;
  scaleSpring?: Spring;
  /** Flutuar depois de entrar: até `peak` px e volta a 0. */
  float?: { peak: number; upMs: number; downMs: number };
  children: ReactNode;
  style?: object;
  pointerEvents?: 'auto' | 'none';
}) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(fromY);
  const scale = useSharedValue(fromScale ?? 1);

  useEffect(() => {
    opacity.value = withDelay(start, withTiming(1, { duration: fadeMs, easing: EASE_OUT }));
    const move = moveMs ?? fadeMs;
    const enter = ySpring ? withSpring(0, ySpring) : withTiming(0, { duration: move, easing: EASE_OUT });
    y.value = withDelay(
      start,
      float
        ? withSequence(
            enter,
            withTiming(float.peak, { duration: float.upMs, easing: EASE_IN_OUT }),
            withTiming(0, { duration: float.downMs, easing: EASE_IN_OUT }),
          )
        : enter,
    );
    if (fromScale !== undefined) {
      scale.value = withDelay(start, scaleSpring ? withSpring(1, scaleSpring) : withTiming(1, { duration: move }));
    }
    // Animação de entrada: roda uma vez, ao montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => {
    const done = skip.value === 1;
    return {
      opacity: done ? 1 : opacity.value,
      transform: [{ translateY: done ? 0 : y.value }, { scale: done ? 1 : scale.value }],
    };
  });

  return (
    <Animated.View style={[style, animated]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

/** Brilho radial atrás do logo: entra e "respira". Decorativo. */
function Glow({ skip }: { skip: SharedValue<number> }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(GLOW_IN.fromScale);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: GLOW_IN.duration, easing: EASE_OUT });
    scale.value = withSequence(
      withTiming(1, { duration: GLOW_IN.duration, easing: EASE_OUT }),
      withTiming(GLOW_BREATHE.peakScale, { duration: GLOW_BREATHE.upMs, easing: EASE_IN_OUT }),
      withTiming(1, { duration: GLOW_BREATHE.downMs, easing: EASE_IN_OUT }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: skip.value === 1 ? 1 : opacity.value,
    transform: [{ scale: skip.value === 1 ? 1 : scale.value }],
  }));

  const size = layout.welcomeGlowSize;
  return (
    <Animated.View
      style={[styles.glow, animated]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="welcomeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.brandPrimary} stopOpacity={0.4} />
            <Stop offset="0.6" stopColor={colors.brandPrimary} stopOpacity={0.1} />
            <Stop offset="1" stopColor={colors.brandPrimary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} fill="url(#welcomeGlow)" />
      </Svg>
    </Animated.View>
  );
}

/** Logo: fade, escala com mola e rotação de −12° a 0°. */
function AnimatedLogo({ skip }: { skip: SharedValue<number> }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(LOGO_IN.fromScale);
  const rotate = useSharedValue(LOGO_IN.fromRotateDeg);

  useEffect(() => {
    opacity.value = withDelay(LOGO_IN.start, withTiming(1, { duration: LOGO_IN.fadeMs, easing: EASE_OUT }));
    scale.value = withDelay(LOGO_IN.start, withSpring(1, SPRING_BOUNCE_50));
    rotate.value = withDelay(LOGO_IN.start, withSpring(0, SPRING_BOUNCE_50));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => {
    const done = skip.value === 1;
    return {
      opacity: done ? 1 : opacity.value,
      transform: [{ scale: done ? 1 : scale.value }, { rotate: `${done ? 0 : rotate.value}deg` }],
    };
  });

  return (
    <Animated.View style={animated}>
      <LogoMark />
    </Animated.View>
  );
}

/** Texto que entra por partes (letras do nome, palavras do slogan). Lido inteiro. */
function StaggeredText({
  skip,
  parts,
  label,
  timing,
  variant,
  color,
  header,
}: {
  skip: SharedValue<number>;
  parts: string[];
  label: string;
  timing: { start: number; span: number; itemMs: number; fromY: number };
  variant: 'display' | 'heading3';
  color?: 'brandPrimaryLight';
  header?: boolean;
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={label}
      accessibilityRole={header ? 'header' : 'text'}
    >
      {parts.map((part, i) => (
        <Reveal
          key={i}
          skip={skip}
          start={timing.start + staggerDelay(i, parts.length, timing.span, timing.itemMs)}
          fadeMs={timing.itemMs}
          fromY={timing.fromY}
        >
          <Text variant={variant} color={color} importantForAccessibility="no">
            {part}
          </Text>
        </Reveal>
      ))}
    </View>
  );
}

const TITLE = 'MyFluenti';
const SLOGAN = 'Understand. Practice. Evolve.';
const DESCRIPTION =
  'Seu professor particular digital. Entenda como o inglês funciona e construa suas próprias frases.';

/** Conteúdo parado (tela 01): estado final sem movimento, sem balões nem brilho. */
export function WelcomeContent() {
  return (
    <View style={styles.brand}>
      <LogoMark />
      <Text variant="display" accessibilityRole="header">
        {TITLE}
      </Text>
      <Text variant="heading3" color="brandPrimaryLight">
        {SLOGAN}
      </Text>
      <Text variant="bodyL" color="textSecondary">
        {DESCRIPTION}
      </Text>
    </View>
  );
}

/**
 * Tela 49: a animação de abertura das Boas-vindas, 3,8 s, tocada toda vez que a tela aparece
 * sem sessão. Um toque em qualquer lugar pula para o estado final. Os botões só recebem
 * toque depois de aparecer.
 */
export function WelcomeIntro({
  renderActions,
}: {
  renderActions: (active: { primary: boolean; secondary: boolean }) => {
    primary: ReactNode;
    secondary: ReactNode;
  };
}) {
  const skip = useSharedValue(0);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState({ primary: false, secondary: false });

  useEffect(() => {
    const timers = [
      setTimeout(() => setActive((a) => ({ ...a, primary: true })), PRIMARY_BUTTON_IN.activeAt),
      setTimeout(() => setActive((a) => ({ ...a, secondary: true })), SECONDARY_BUTTON_IN.activeAt),
      setTimeout(() => setDone(true), INTRO_TOTAL_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const skipNow = () => {
    skip.value = 1;
    setActive({ primary: true, secondary: true });
    setDone(true);
  };

  const actions = renderActions(active);

  return (
    <View style={styles.fill}>
      <FlowScreen centered>
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Glow skip={skip} />
            <AnimatedLogo skip={skip} />
            <View
              style={styles.balloonLayer}
              pointerEvents="none"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            >
              {BALLOONS.map((b) => (
                <Reveal
                  key={b.text}
                  skip={skip}
                  start={b.start}
                  fadeMs={BALLOON_IN.fadeMs}
                  moveMs={BALLOON_IN.moveMs}
                  fromY={BALLOON_IN.fromY}
                  fromScale={BALLOON_IN.fromScale}
                  scaleSpring={SPRING_BOUNCE_45}
                  float={b.float}
                  style={[styles.balloon, b.filled ? styles.balloonFilled : styles.balloonOutline, { left: b.x, top: b.y }]}
                >
                  <Text variant="balloon" color={b.filled ? 'textOnPrimary' : 'textPrimary'}>
                    {b.text}
                  </Text>
                </Reveal>
              ))}
            </View>
          </View>
          <StaggeredText skip={skip} parts={TITLE.split('')} label={TITLE} timing={TITLE_IN} variant="display" header />
          <StaggeredText
            skip={skip}
            parts={SLOGAN.split(' ').map((w, i, all) => (i < all.length - 1 ? `${w} ` : w))}
            label={SLOGAN}
            timing={SLOGAN_IN}
            variant="heading3"
            color="brandPrimaryLight"
          />
          <Reveal skip={skip} start={DESCRIPTION_IN.start} fadeMs={DESCRIPTION_IN.duration} fromY={DESCRIPTION_IN.fromY}>
            <Text variant="bodyL" color="textSecondary">
              {DESCRIPTION}
            </Text>
          </Reveal>
        </View>
        <View style={styles.actions}>
          <Reveal
            skip={skip}
            start={PRIMARY_BUTTON_IN.start}
            fadeMs={PRIMARY_BUTTON_IN.fadeMs}
            fromY={PRIMARY_BUTTON_IN.fromY}
            ySpring={SPRING_BOUNCE_25}
            pointerEvents={active.primary ? 'auto' : 'none'}
          >
            {actions.primary}
          </Reveal>
          <Reveal
            skip={skip}
            start={SECONDARY_BUTTON_IN.start}
            fadeMs={SECONDARY_BUTTON_IN.fadeMs}
            fromY={SECONDARY_BUTTON_IN.fromY}
            ySpring={SPRING_BOUNCE_25}
            pointerEvents={active.secondary ? 'auto' : 'none'}
          >
            {actions.secondary}
          </Reveal>
        </View>
      </FlowScreen>
      {done ? null : (
        // Tocar em qualquer lugar pula para o estado final. Fora da árvore de acessibilidade.
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={skipNow}
          accessible={false}
          importantForAccessibility="no"
          aria-hidden
        />
      )}
    </View>
  );
}

const LOGO_SIZE = layout.logoMarkSize;
const GLOW_OFFSET = (LOGO_SIZE - layout.welcomeGlowSize) / 2;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  brand: { gap: spacing.lg },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  logoBox: { width: LOGO_SIZE, height: LOGO_SIZE },
  glow: {
    position: 'absolute',
    left: GLOW_OFFSET,
    top: GLOW_OFFSET,
    width: layout.welcomeGlowSize,
    height: layout.welcomeGlowSize,
  },
  /** Camada dos balões: larga o bastante para o texto não quebrar (o logo é estreito). */
  balloonLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: layout.welcomeGlowSize,
    height: LOGO_SIZE,
  },
  balloon: {
    position: 'absolute',
    borderRadius: radius.lg,
    paddingHorizontal: layout.balloonPaddingX,
    paddingVertical: layout.balloonPaddingY,
  },
  balloonFilled: { backgroundColor: colors.brandPrimary },
  balloonOutline: {
    backgroundColor: colors.bgElevated,
    borderWidth: layout.borderWidth,
    borderColor: colors.brandPrimaryBorder,
  },
});
