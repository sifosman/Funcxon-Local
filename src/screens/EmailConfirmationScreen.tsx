import { ScrollView, Text, View } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';

type Props = {
  navigation: { navigate: (screen: 'SignIn') => void };
  route: { params?: { email?: string; role?: 'attendee' | 'vendor' } };
};

export default function EmailConfirmationScreen({ route, navigation }: Props) {
  const email = route.params?.email;
  const role = route.params?.role === 'vendor' ? 'vendor' : 'attendee';
  const roleLabel = role === 'vendor' ? 'Vendor' : 'Attendee';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          justifyContent: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radii.xl,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>✉️</Text>
          </View>

          <Text
            style={{
              ...typography.titleLarge,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
              textAlign: 'center',
            }}
          >
            Confirm your email
          </Text>

          <Text
            style={{
              ...typography.body,
              color: colors.textMuted,
              marginBottom: spacing.md,
              textAlign: 'center',
            }}
          >
            Weve created your {roleLabel.toLowerCase()} account.
          </Text>

          {email ? (
            <Text
              style={{
                ...typography.body,
                color: colors.textPrimary,
                marginBottom: spacing.lg,
                textAlign: 'center',
              }}
            >
              Weve sent a confirmation link to {email}. Please check your inbox and follow the
              link to activate your account.
            </Text>
          ) : (
            <Text
              style={{
                ...typography.body,
                color: colors.textPrimary,
                marginBottom: spacing.lg,
                textAlign: 'center',
              }}
            >
              Weve sent a confirmation link to your email address. Please check your inbox and
              follow the link to activate your account.
            </Text>
          )}

          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              marginBottom: spacing.xl,
              textAlign: 'center',
            }}
          >
            Once your email is confirmed, simply sign in with your credentials and youll be taken
            straight to your home screen.
          </Text>

          <PrimaryButton title="Go to login" onPress={() => navigation.navigate('SignIn')} />
        </View>
      </ScrollView>
    </View>
  );
}
