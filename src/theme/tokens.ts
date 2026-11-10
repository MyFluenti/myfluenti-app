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

// Nomes exatos das famílias registradas por peso (expo-font / @expo-google-fonts).
// No Android e no iOS, 'Manrope' + fontWeight não encontra a fonte: use sempre estes nomes.
export const fontFamilies = {
  manrope: {
    400: 'Manrope_400Regular',
    600: 'Manrope_600SemiBold',
    700: 'Manrope_700Bold',
    800: 'Manrope_800ExtraBold',
  },
  inter: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
  },
} as const;

// Mantido por compatibilidade (nome lógico das famílias). Não use como fontFamily.
export const fonts = {
  display: 'Manrope',
  text: 'Inter',
} as const;

// Sem fontWeight: o peso já está embutido no nome da família.
export const typography = {
  display: { fontFamily: fontFamilies.manrope[700], fontSize: 28, lineHeight: 36 },
  heading1: { fontFamily: fontFamilies.manrope[700], fontSize: 24, lineHeight: 32 },
  heading2: { fontFamily: fontFamilies.manrope[600], fontSize: 20, lineHeight: 28 },
  heading3: { fontFamily: fontFamilies.manrope[600], fontSize: 17, lineHeight: 24 },
  button: { fontFamily: fontFamilies.manrope[600], fontSize: 16, lineHeight: 20 },
  bodyL: { fontFamily: fontFamilies.inter[400], fontSize: 16, lineHeight: 24 },
  bodyM: { fontFamily: fontFamilies.inter[400], fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamilies.inter[600], fontSize: 13, lineHeight: 16 },
  caption: { fontFamily: fontFamilies.inter[500], fontSize: 12, lineHeight: 16 },
} as const;

export type ColorToken = keyof typeof colors;
export type TypographyVariant = keyof typeof typography;

export const layout = {
  screenPaddingX: spacing.xl,
  buttonHeight: 52,
  bottomNavHeight: 72,
  minTouchTarget: 44,
  progressHeight: 8,
  iconSize: 24,
  iconStroke: 2,
  inputHeight: 52,
  lessonRowMinHeight: 72,
  borderWidth: 1,
  borderWidthStrong: 2,
  stateIconSize: 96,
  skeletonCardHeight: 72,
  skeletonHeroHeight: 120,
  avatarSize: 64,
  avatarProfile: 112,
  avatarPreview: 160,
  avatarTile: 60,
  formItemMinWidth: 100,
} as const;

// Opacidade só para feedback de toque (pressed). Estado desabilitado usa cores, não opacidade.
export const opacity = {
  pressed: 0.85,
  /** Amostra de cor indisponível (ex.: cor do cabelo com "Sem cabelo"). */
  muted: 0.35,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  fontFamilies,
  typography,
  layout,
  opacity,
} as const;
export type Theme = typeof theme;
