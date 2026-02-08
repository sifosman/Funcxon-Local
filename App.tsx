import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import FloatingHelpButton from './src/components/FloatingHelpButton';
import { HelpCenterModal } from './src/components/HelpCenterModal';
import { useVendorStatus } from './src/hooks/useVendorStatus';

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
  const [helpVisible, setHelpVisible] = useState(false);
  
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
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ApplicationFormProvider>
              <NavigationContainer theme={navTheme}>
                <AppContent helpVisible={helpVisible} setHelpVisible={setHelpVisible} />
                <StatusBar style="dark" translucent backgroundColor="transparent" />
              </NavigationContainer>
            </ApplicationFormProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AppContent({ helpVisible, setHelpVisible }: { helpVisible: boolean; setHelpVisible: (visible: boolean) => void }) {
  const { isVendor } = useVendorStatus();
  
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      {isVendor && <FloatingHelpButton onPress={() => setHelpVisible(true)} />}
      {isVendor && <HelpCenterModal visible={helpVisible} onClose={() => setHelpVisible(false)} />}
    </View>
  );
}
