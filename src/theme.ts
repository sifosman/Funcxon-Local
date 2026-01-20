// Color palette matching Replit prototype design system
// Primary: Teal/Cyan hsl(195, 65%, 45%) = #2B9EB3
// Background: Warm beige hsl(45, 50%, 96%) = #F8F6F0
// Foreground: Deep teal-gray hsl(195, 15%, 20%) = #2B3840

export const colors = {
  // Backgrounds & surfaces
  background: '#F8F6F0', // warm beige background hsl(45, 50%, 96%)
  backgroundAlt: '#EDE9DD', // slightly darker beige hsl(45, 40%, 94%)
  surface: '#FFFFFF', // white cards/surfaces
  surfaceMuted: '#F5F1E8', // muted surface hsl(45, 40%, 94%)

  // Brand primaries - Teal/Cyan from Replit
  primary: '#2B9EB3', // teal primary hsl(195, 65%, 45%)
  primaryTeal: '#2B9EB3', // same as primary for consistency
  primaryForeground: '#FFFFFF', // white text on primary
  
  // Secondary colors
  secondary: '#9DCFDB', // lighter teal hsl(165, 50%, 75%)
  secondaryForeground: '#2B3840',
  accent: '#D9EBE8', // very light teal hsl(165, 35%, 88%)
  accentForeground: '#2B3840',

  // Text colors
  textPrimary: '#2B3840', // deep teal-gray hsl(195, 15%, 20%)
  textSecondary: '#5A7A85', // medium teal-gray hsl(195, 15%, 45%)
  textMuted: '#8FA3AB', // light teal-gray hsl(195, 15%, 60%)

  // Borders & inputs
  borderSubtle: '#D4CFBD', // warm border hsl(165, 25%, 85%)
  borderStrong: '#B8C9C9', // stronger border hsl(165, 25%, 75%)
  inputBackground: '#E8E4D8', // input bg hsl(165, 25%, 90%)
  inputBorder: '#D4CFBD',
  
  // Utility colors
  destructive: '#FF0000', // red for errors/delete
  destructiveForeground: '#FFFFFF',
  muted: '#EDE9DD', // muted bg hsl(45, 40%, 94%)
  mutedForeground: '#5A7A85',
  
  // Chart colors (from Replit)
  chart1: '#2B9EB3', // primary teal
  chart2: '#9DCFDB', // secondary teal
  chart3: '#D9EBE8', // accent
  chart4: '#3F6F71', // darker teal
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
};
