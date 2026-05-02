import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';

export default function GuestPromptScreen({ label }: { label: string }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('../../assets/1000478602.jpg')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' }}>
        Sign in to access {label}
      </Text>
      <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', maxWidth: 320 }}>
        Create a free account or sign in to unlock all features and save your preferences.
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.getParent()?.navigate('Auth', { screen: 'SignIn' })}
        style={{
          width: '100%',
          maxWidth: 320,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: '#FFFFFF' }}>Log in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.getParent()?.navigate('Auth', { screen: 'SignUp' })}
        style={{
          width: '100%',
          maxWidth: 320,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.primary }}>Get started</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={{ marginTop: spacing.lg, padding: spacing.sm }}
      >
        <Text style={{ ...typography.body, color: colors.textMuted }}>
          Continue browsing
        </Text>
      </TouchableOpacity>
    </View>
  );
}
