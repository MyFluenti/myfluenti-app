// Tokens de design do MyFluenti. Fonte: myfluenti-docs/docs/marca/identidade-visual.md
// Não use cores, tamanhos ou fontes soltos nos componentes: importe daqui.

export const colors = {
  bgBase: '#101116',
  bgSurface: '#191B24',
  bgElevated: '#242735',
  borderDefault: '#2E3142',
  brandPrimary: '#8B78F6',
  brandPrimaryLight: '#B9ACFF',
  brandPrimarySubtle: '#2A2547',
  statusSuccess: '#55C7A5',
  statusSuccessSubtle: '#16322F',
  statusWarning: '#F0B866',
  statusError: '#F07A8A',
  statusErrorSubtle: '#3A1F2A',
  textPrimary: '#F4F4F7',
  textSecondary: '#A6A7B2',
  textOnPrimary: '#101116',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fonts = {
  display: 'Manrope',
  text: 'Inter',
} as const;

export const typography = {
  display: { fontFamily: fonts.display, fontWeight: '700', fontSize: 28, lineHeight: 36 },
  heading1: { fontFamily: fonts.display, fontWeight: '700', fontSize: 24, lineHeight: 32 },
  heading2: { fontFamily: fonts.display, fontWeight: '600', fontSize: 20, lineHeight: 28 },
  heading3: { fontFamily: fonts.display, fontWeight: '600', fontSize: 17, lineHeight: 24 },
  button: { fontFamily: fonts.display, fontWeight: '600', fontSize: 16, lineHeight: 20 },
  bodyL: { fontFamily: fonts.text, fontWeight: '400', fontSize: 16, lineHeight: 24 },
  bodyM: { fontFamily: fonts.text, fontWeight: '400', fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.text, fontWeight: '600', fontSize: 13, lineHeight: 16 },
  caption: { fontFamily: fonts.text, fontWeight: '500', fontSize: 12, lineHeight: 16 },
} as const;

export const layout = {
  screenPaddingX: spacing.xl,
  buttonHeight: 52,
  bottomNavHeight: 72,
  minTouchTarget: 44,
} as const;

export const theme = { colors, spacing, radius, fonts, typography, layout } as const;
export type Theme = typeof theme;
