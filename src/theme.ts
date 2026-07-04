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
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
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
};
