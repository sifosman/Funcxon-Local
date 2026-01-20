import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/auth/AuthContext';
import { ApplicationFormProvider } from './src/context/ApplicationFormContext';
import { colors } from './src/theme';
import { useFonts } from '@expo-google-fonts/montserrat';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

const queryClient = new QueryClient();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryTeal,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.borderSubtle,
  },
};

export default function App() {
  // Only load custom fonts on native platforms
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    ...(Platform.OS !== 'web'
      ? {
          'TAN-Grandeur': require('./assets/TAN-Grandeur/TAN-Grandeur/TAN Grandeur/TANGRANDEUR.ttf'),
        }
      : {}),
  });

  // On web, don't wait for fonts - use system fonts as fallback
  if (!fontsLoaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApplicationFormProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </ApplicationFormProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
