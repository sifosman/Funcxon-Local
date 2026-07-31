import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { linking } from './src/navigation/linking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ApplicationFormProvider } from './src/context/ApplicationFormContext';
import { PendingSearchProvider } from './src/context/PendingSearchContext';
import { colors } from './src/theme';
import { useFonts } from '@expo-google-fonts/montserrat';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { HelpCenterModal } from './src/components/HelpCenterModal';
import DataConsentModal, { hasAcceptedDataConsent } from './src/components/DataConsentModal';
import { useVendorStatus } from './src/hooks/useVendorStatus';
import AppHeader from './src/components/AppHeader';
import * as SystemUI from 'expo-system-ui';

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
  const [consentVisible, setConsentVisible] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    hasAcceptedDataConsent().then((accepted) => {
      if (!accepted) {
        setConsentVisible(true);
      }
      setConsentChecked(true);
    });
  }, []);

  // Enforce white body background on the web build (desktop view)
  useEffect(() => {
    if (Platform.OS === 'web') {
      SystemUI.setBackgroundColorAsync(colors.background);
    }
  }, []);

  // Only load custom fonts on native platforms
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  // On web, don't wait for fonts - use system fonts as fallback
  if ((!fontsLoaded && Platform.OS !== 'web') || !consentChecked) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ApplicationFormProvider>
              <PendingSearchProvider>
                <NavigationContainer theme={navTheme} linking={linking as any}>
                  <AppContent helpVisible={helpVisible} setHelpVisible={setHelpVisible} />
                  <DataConsentModal
                    visible={consentVisible}
                    onAccept={() => setConsentVisible(false)}
                  />
                  <StatusBar style="dark" translucent backgroundColor="transparent" />
                </NavigationContainer>
              </PendingSearchProvider>
            </ApplicationFormProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AppContent({ helpVisible, setHelpVisible }: { helpVisible: boolean; setHelpVisible: (visible: boolean) => void }) {
  const { isVendor } = useVendorStatus();
  const navigation = useNavigation<any>();

  useEffect(() => {
    const handlePaymentDeepLink = (url: string | null) => {
      if (!url || Platform.OS === 'web') return;
      if (url.startsWith('funxon://payment/success') || url.startsWith('funxon://payment/cancel')) {
        navigation.navigate('Main', { screen: 'Account', params: { screen: 'Billing' } });
      }
    };

    Linking.getInitialURL().then(handlePaymentDeepLink);
    const subscription = Linking.addEventListener('url', (event) => handlePaymentDeepLink(event.url));
    return () => subscription.remove();
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <AppNavigator />
      {isVendor && (
        <HelpCenterModal
          visible={helpVisible}
          onClose={() => setHelpVisible(false)}
          onNavigateToHelp={() => {
            setHelpVisible(false);
            navigation.navigate('PortfolioAssistance', { openFaqs: true });
          }}
        />
      )}
    </View>
  );
}
