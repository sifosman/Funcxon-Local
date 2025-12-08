import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/auth/AuthContext';
import { colors } from './src/theme';
import { useFonts, Bellota_400Regular, Bellota_700Bold } from '@expo-google-fonts/bellota';

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
  const [fontsLoaded] = useFonts({
    Bellota_400Regular,
    Bellota_700Bold,
    'TAN-Grandeur': require('./assets/TAN-Grandeur/TAN-Grandeur/TAN Grandeur/TANGRANDEUR.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
