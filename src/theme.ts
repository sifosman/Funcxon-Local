// Color palette matching Replit prototype design system
// Primary: Deep Navy #010035
// Background: White
// Foreground: Deep navy hsl(241, 100%, 10%) = #010035

export const colors = {
  // Backgrounds & surfaces
  background: '#FFFFFF', // white background
  backgroundAlt: '#FFFFFF', // white background
  surface: '#FFFFFF', // white cards/surfaces
  surfaceMuted: '#FFFFFF', // white muted surface

  // Brand primaries - Deep Navy
  primary: '#010035', // deep navy primary
  primaryTeal: '#010035', // updated from teal for consistency
  primaryForeground: '#FFFFFF', // white text on primary
  
  // Secondary colors
  secondary: '#9DCFDB', // light blue
  secondaryForeground: '#2B3840',
  accent: '#D9EBE8', // very light blue
  accentForeground: '#2B3840',

  // Text colors
  textPrimary: '#2B3840', // deep gray-navy
  textSecondary: '#5A7A85', // medium gray-navy
  textMuted: '#8FA3AB', // light gray-navy

  // Borders & inputs
  borderSubtle: '#D4CFBD', // warm border hsl(165, 25%, 85%)
  borderStrong: '#B8C9C9', // stronger border hsl(165, 25%, 75%)
  inputBackground: '#FFFFFF', // white input bg
  inputBorder: '#D4CFBD',
  
  // Utility colors
  destructive: '#FF0000', // red for errors/delete
  destructiveForeground: '#FFFFFF',
  muted: '#FFFFFF', // white muted bg
  mutedForeground: '#5A7A85',
  chipBackground: '#FFFFFF', // white chip background color
  
  // Chart colors (from Deep Navy theme)
  chart1: '#010035', // primary navy
  chart2: '#9DCFDB', // secondary blue
  chart3: '#D9EBE8', // accent
  chart4: '#1A1948', // darker navy
  chart5: '#2B3840', // darkest
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
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'PlayfairDisplay_600SemiBold',
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
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  displayMedium: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 8,
    color: colors.textPrimary,
  },
};
