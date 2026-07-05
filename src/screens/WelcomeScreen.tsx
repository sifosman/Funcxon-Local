import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDesktop } from '../hooks/useIsDesktop';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();

  const features = [
    {
      icon: 'search',
      title: 'Discover the perfect venues, vendors and service professional',
      body: 'Browse a curated marketplace of top-tier event professionals.',
    },
    {
      icon: 'rule',
      title: 'Compare & request quotes',
      body: 'Easily compare options and get quotes from multiple vendors.',
    },
    {
      icon: 'celebration',
      title: 'Plan your entire event in one place',
      body: 'Manage bookings, communication, and planning seamlessly.',
    },
  ];

  const renderFeatureItem = (item: typeof features[0]) => (
    <View
      key={item.title}
      style={{
        flexDirection: 'row',
        padding: isDesktop ? spacing.md : spacing.md,
        borderRadius: isDesktop ? radii.lg : radii.md,
        backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
        alignItems: 'center',
        marginBottom: spacing.sm,
        borderWidth: isDesktop ? 1 : 0,
        borderColor: isDesktop ? colors.outlineVariant : undefined,
      }}
    >
      <MaterialIcons
        name={item.icon as any}
        size={isDesktop ? 28 : 24}
        color={colors.primary}
        style={{ marginRight: spacing.md }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ ...(isDesktop ? typography.titleMedium : typography.titleMedium), color: colors.textPrimary, marginBottom: spacing.xs }}>
          {item.title}
        </Text>
        <Text style={{ ...(isDesktop ? typography.bodyMd : typography.caption), color: colors.textSecondary }}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView
        contentContainerStyle={isDesktop ? {
          flexGrow: 1,
          paddingHorizontal: 48,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl * 2,
          justifyContent: 'center',
          alignItems: 'center',
        } : {
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl * 2,
          justifyContent: 'flex-start',
        }}
      >
        {isDesktop ? (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              padding: spacing.xxl,
              gap: spacing.xl,
              maxWidth: 1200,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 28,
                    backgroundColor: '#f7f5f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={{ ...typography.headlineMd, color: colors.textPrimary }}>Welcome to Funxon</Text>
                  <Text style={{ ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs, maxWidth: 360 }}>
                    Connect, collaborate, and celebrate with trusted vendors.
                  </Text>
                </View>
              </View>
              <View>{features.map(renderFeatureItem)}</View>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch', gap: spacing.md, paddingHorizontal: spacing.xl }}>
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
                  backgroundColor: colors.surfaceContainerLowest,
                }}
              >
                <Text style={{ ...typography.button, color: colors.primary }}>Log in</Text>
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
                <Text style={{ ...typography.button, color: '#FFFFFF' }}>Get started</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
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
                    backgroundColor: '#f7f5f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>Welcome to Funxon</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
                  Connect, collaborate, and celebrate with trusted vendors.
                </Text>
              </View>

              <View style={{ marginTop: spacing.md }}>
                {features.map(renderFeatureItem)}
              </View>
            </View>

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
                <Text style={{ ...typography.button, color: colors.primary }}>Log in</Text>
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
                <Text style={{ ...typography.button, color: '#FFFFFF' }}>Get started</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
