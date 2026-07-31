import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useIsDesktop } from '../hooks/useIsDesktop';

type Props = NativeStackScreenProps<AuthStackParamList, 'GuestPrompt'> | { label: string };

export default function GuestPromptScreen(props: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const label = 'label' in props ? props.label : (props as NativeStackScreenProps<AuthStackParamList, 'GuestPrompt'>).route.params.label;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDesktop ? colors.surfaceBg : colors.background,
        paddingHorizontal: isDesktop ? 48 : spacing.lg,
        paddingTop: isDesktop ? spacing.xxl : insets.top + spacing.xl,
        paddingBottom: isDesktop ? spacing.xxl : insets.bottom + spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: isDesktop ? 140 : 100,
            height: isDesktop ? 140 : 100,
            borderRadius: isDesktop ? 70 : 50,
            backgroundColor: '#f7f5f0',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        <Text style={{ ...(isDesktop ? typography.headlineMd : typography.titleLarge), color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' }}>
          Sign in to access {label.toLowerCase()}
        </Text>
        <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', maxWidth: 520 }}>
          Create a free account or sign in to unlock all features and save your preferences.
        </Text>

        <View style={{ width: '100%', maxWidth: isDesktop ? 480 : 320, gap: spacing.md } as any}>
          <TouchableOpacity
            testID="guest-login"
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate('Auth', { screen: 'SignIn' })}
            style={{
              width: '100%',
              paddingVertical: isDesktop ? spacing.lg : spacing.md,
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...typography.button, color: '#FFFFFF' }}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="guest-get-started"
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate('Auth', { screen: 'SignUp' })}
            style={{
              width: '100%',
              paddingVertical: isDesktop ? spacing.lg : spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.primary,
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...typography.button, color: colors.primary }}>Get started</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg, padding: spacing.sm }}
          >
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Continue browsing
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}
