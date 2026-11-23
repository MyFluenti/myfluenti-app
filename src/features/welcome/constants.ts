import { Easing } from 'react-native-reanimated';

/**
 * Animação de primeira abertura das Boas-vindas (tela 49). Fonte de verdade:
 * myfluenti-docs/docs/marca/animacoes/boas-vindas.md. Tempos em milissegundos.
 * Tudo aqui pode ser ajustado no aparelho sem mexer no componente.
 */

/** Duração total; ao fim a animação é marcada como vista. */
export const INTRO_TOTAL_MS = 3800;

/** "Reduzir movimento": só um fade da tela inteira. */
export const REDUCED_FADE_MS = 200;

// ---------- curvas ----------
export const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
export const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** Molas convertidas do Figma (bounce). Valores iniciais para ajustar no aparelho. */
export const SPRING_BOUNCE_50 = { damping: 9, stiffness: 140, mass: 1 };
export const SPRING_BOUNCE_45 = { damping: 10, stiffness: 140, mass: 1 };
export const SPRING_BOUNCE_25 = { damping: 16, stiffness: 170, mass: 1 };

// ---------- brilho ----------
export const GLOW_IN = { start: 0, duration: 900, fromScale: 0.5 };
/** "Respirar": 1 → 1,10 até 2,4 s e volta a 1 em 3,8 s. */
export const GLOW_BREATHE = { peakScale: 1.1, upMs: 1500, downMs: 1400 };

// ---------- logo ----------
export const LOGO_IN = {
  start: 100,
  fadeMs: 250,
  fromScale: 0.3,
  fromRotateDeg: -12,
};

// ---------- balões ----------
/** Posição relativa ao canto superior esquerdo do logo. Flutuar: até o pico e volta. */
export const BALLOONS = [
  { text: 'Hello!', x: 114, y: -32, start: 800, float: { peak: -4, upMs: 1200, downMs: 1300 }, filled: true },
  { text: 'How are you?', x: 176, y: 8, start: 1050, float: { peak: 4, upMs: 1250, downMs: 1000 }, filled: false },
  { text: "I'm learning!", x: 120, y: 52, start: 1300, float: { peak: -3, upMs: 1200, downMs: 800 }, filled: true },
] as const;
export const BALLOON_IN = { fadeMs: 200, moveMs: 500, fromScale: 0.4, fromY: 12 };

// ---------- textos ----------
export const TITLE_IN = { start: 900, span: 700, itemMs: 400, fromY: 20 };
export const SLOGAN_IN = { start: 1500, span: 800, itemMs: 500, fromY: 16 };
export const DESCRIPTION_IN = { start: 2100, duration: 500, fromY: 14 };

// ---------- botões ----------
export const PRIMARY_BUTTON_IN = { start: 2400, fadeMs: 300, fromY: 28, activeAt: 3000 };
export const SECONDARY_BUTTON_IN = { start: 2550, fadeMs: 300, fromY: 28, activeAt: 3150 };

/** Atraso de cada item numa sequência (letra por letra, palavra por palavra). */
export function staggerDelay(index: number, count: number, span: number, itemMs: number): number {
  if (count <= 1) return 0;
  return ((span - itemMs) / (count - 1)) * index;
}
