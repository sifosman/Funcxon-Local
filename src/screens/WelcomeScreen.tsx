import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl * 2,
          justifyContent: 'flex-start', // Start from top instead of center
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.xl,
            width: '100%',
            maxWidth: 420,
            alignSelf: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
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
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>Welcome to Funcxon</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
              Connect, collaborate, and celebrate with trusted vendors.
            </Text>
          </View>

          <View style={{ marginTop: spacing.md }}>
            {[
              {
                icon: 'search',
                title: 'Discover the perfect vendors',
                body: 'Browse a curated marketplace of top-tier event professionals.',
              },
              {
                icon: 'rule',
                title: 'Compare & request quotes',
                body: 'Easily compare options and get quotes from multiple vendors.',
              },
              {
                icon: 'celebration',
                title: 'Plan your event in one place',
                body: 'Manage bookings, communication, and planning seamlessly.',
              },
            ].map((item) => (
              <View
                key={item.title}
                style={{
                  flexDirection: 'row',
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={colors.primaryTeal}
                  style={{ marginRight: spacing.md }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                    {item.title}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>

        </View>

        {/* Buttons placed outside the card so they never overlap card content */}
        <View style={{ marginTop: spacing.lg, maxWidth: 420, alignSelf: 'center', width: '100%' }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SignIn')}
            style={{
              width: '100%',
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.sm,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.primary }}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SignUp')}
            style={{
              width: '100%',
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...typography.titleMedium, color: '#FFFFFF' }}>Get started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
