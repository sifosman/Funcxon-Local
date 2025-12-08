// Brand palette (approximate hex values from provided swatch, left to right):
// 1) Deep blue, 2) Teal, 3) Sage, 4) Sand, 5) Soft cream
export const colors = {
  // Backgrounds & surfaces
  background: '#FFFFFF', // app background white
  backgroundAlt: '#E4DFC1', // sand
  surface: '#FFFFFF',
  surfaceMuted: '#B5C9C0', // sage

  // Brand primaries
  primary: '#0F3B57', // deep blue as primary for buttons/accents
  primaryAlt: '#3F6F71', // teal
  primaryTeal: '#3F6F71', // alias for convenience in components
  accent: '#B5C9C0', // sage accent

  // Text colors
  textPrimary: '#0F3B57',
  textSecondary: '#3F6F71',
  textMuted: '#B5C9C0',

  // Borders & inputs
  borderSubtle: '#E4DFC1',
  borderStrong: '#B5C9C0',
  inputBackground: '#FFFFFF',
  inputBorder: '#B5C9C0',
  chipBackground: '#FFFFFF',
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
    fontFamily: 'Bellota_700Bold',
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Bellota_700Bold',
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Bellota_400Regular',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'Bellota_400Regular',
  },
  displayLarge: {
    fontSize: 28,
    fontWeight: '400' as const,
    fontFamily: 'TAN-Grandeur',
  },
  displayMedium: {
    fontSize: 22,
    fontWeight: '400' as const,
    fontFamily: 'TAN-Grandeur',
  },
};
