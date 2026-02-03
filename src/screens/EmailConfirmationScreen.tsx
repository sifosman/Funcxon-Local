import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

type Props = {
  navigation: { navigate: (screen: 'SignIn') => void };
  route: { params?: { email?: string; role?: 'attendee' | 'vendor' } };
};

export default function EmailConfirmationScreen({ route, navigation }: Props) {
  const { resendConfirmationEmail } = useAuth();
  const email = route.params?.email;
  const role = route.params?.role === 'vendor' ? 'vendor' : 'attendee';
  const roleLabel = role === 'vendor' ? 'Vendor' : 'Attendee';
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'No email address found. Please sign up again.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Confirmation email resent! Please check your inbox.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

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
          {/* Icon Container */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radii.full,
              backgroundColor: '#E0F2F7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="mark-email-read" size={56} color={colors.primaryTeal} />
          </View>

          {/* Title */}
          <Text
            style={{
              ...typography.titleLarge,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
              textAlign: 'center',
              fontWeight: '700',
            }}
          >
            Check your email
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              ...typography.body,
              color: colors.textMuted,
              marginBottom: spacing.lg,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            We've sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.
          </Text>

          {/* Email Address Display */}
          {email && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                marginBottom: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <MaterialIcons name="email" size={20} color={colors.primaryTeal} />
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                {email}
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.xl,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
            }}
          >
            <MaterialIcons name="info" size={20} color="#F59E0B" style={{ marginTop: 2 }} />
            <Text
              style={{
                ...typography.caption,
                color: '#92400E',
                flex: 1,
                lineHeight: 20,
              }}
            >
              Once confirmed, sign in with your credentials to access your {roleLabel.toLowerCase()} dashboard.
            </Text>
          </View>

          {/* Go to Login Button */}
          <PrimaryButton title="Go to Sign In" onPress={() => navigation.navigate('SignIn')} />

          {/* Resend Email Option */}
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={isResending}
            style={{
              marginTop: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <MaterialIcons
              name="refresh"
              size={16}
              color={isResending ? colors.textMuted : colors.primaryTeal}
            />
            <Text
              style={{
                ...typography.caption,
                color: isResending ? colors.textMuted : colors.primaryTeal,
                fontWeight: '600',
              }}
            >
              {isResending ? 'Resending...' : 'Resend confirmation email'}
            </Text>
          </TouchableOpacity>

          {/* Troubleshooting Link */}
          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              marginTop: spacing.xl,
              textAlign: 'center',
            }}
          >
            Can't find the email? Check your spam folder or contact support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
