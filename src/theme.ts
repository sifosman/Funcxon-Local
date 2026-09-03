// Funxon brand color palette
// Primary: Teal #123f5c
// Secondary: Medium Teal #1a5270
// Accent: Light Lavender #b9c4eb
// Background: White #FFFFFF
// Foreground: Black #000000 (mandatory)
// Borders: Light Cream #f7f5f0
// Muted: Dusty Rose #aa7478

export const colors = {
  // Backgrounds & surfaces
  background: '#FFFFFF', // white background
  backgroundAlt: '#FFFFFF', // white background
  surface: '#FFFFFF', // white cards/surfaces
  surfaceMuted: '#FFFFFF', // white muted surface

  // Brand primaries - Funxon Teal
  primary: '#123f5c', // teal primary
  primaryTeal: '#1a5270', // medium teal accent
  primaryForeground: '#FFFFFF', // white text on primary
  primaryMuted: '#e8f0f5', // very light teal for disabled/hover states

  // Secondary colors
  secondary: '#b9c4eb', // light lavender
  secondaryForeground: '#000000',
  accent: '#f2f7ff', // very light blue
  accentForeground: '#000000',

  // New 2026 accent colours
  cta: '#1ea5c9', // medium turquoise - primary CTA buttons / active states
  accentBright: '#62d9dd', // bright teal - small badges/labels
  accentSoft: '#a4deff', // light sky blue - soft accent surfaces

  // Text colors
  textPrimary: '#000000', // black (mandatory)
  textSecondary: '#000000', // black
  textMuted: '#000000', // black

  // Brand cream (header background)
  brandPink: '#f7f5f0',
  brandPinkLight: '#f7f5f0',

  // Borders & inputs
  borderSubtle: '#f7f5f0', // light cream
  borderStrong: '#f7f5f0', // cream
  inputBackground: '#FFFFFF', // white input bg
  inputBorder: '#f7f5f0',

  // Utility colors
  destructive: '#DC2626', // red for errors/delete
  destructiveForeground: '#FFFFFF',
  muted: '#FFFFFF', // white muted bg
  mutedForeground: '#000000',
  chipBackground: '#FFFFFF', // white chip background color

  // Chart colors (Funxon palette)
  chart1: '#123f5c', // teal
  chart2: '#1a5270', // medium teal
  chart3: '#b9c4eb', // light lavender
  chart4: '#f7f5f0', // cream
  chart5: '#aa7478', // dusty rose

  // Desktop design system ( Heritage Premium)
  onSurfaceVariant: '#42474d',
  onSurface: '#1b1c19',
  gold: '#ffd700',
  surfaceBg: '#fbf9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainer: '#f0eee9',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',
  outline: '#72787e',
  outlineVariant: '#c2c7ce',
  dustyRose: '#aa7478',
  secondaryBlue: '#306382',
  coral: '#F26B4F', // coral accent for favourites, active tabs, selected chips
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  // Desktop design system
  maxWidth: 1200,
  sectionPadding: 80,
  gutter: 24,
  marginDesktop: 48,
  marginMobile: 20,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const typography = {
  titleLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Montserrat_400Regular',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'Montserrat_400Regular',
  },
  displayLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
  },
  displayMedium: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
  },
  buttonMedium: {
    fontSize: 13,
    fontWeight: '500' as const,
    fontFamily: 'Montserrat_500Medium',
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
  },
  bodySemiBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Montserrat_500Medium',
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
  },
  captionSemiBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
  },
  // Desktop typography (Montserrat — same as mobile app)
  displayLg: {
    fontSize: 56,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
    lineHeight: 64,
    letterSpacing: -0.02,
  },
  headlineLg: {
    fontSize: 40,
    fontWeight: '700' as const,
    fontFamily: 'Montserrat_700Bold',
    lineHeight: 48,
  },
  headlineMd: {
    fontSize: 32,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 40,
  },
  headlineSm: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 32,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    fontFamily: 'Montserrat_400Regular',
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Montserrat_400Regular',
    lineHeight: 24,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 16,
    letterSpacing: 0.05,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 16,
    letterSpacing: 0.05,
  },
};
