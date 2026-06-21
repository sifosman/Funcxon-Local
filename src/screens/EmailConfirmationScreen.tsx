import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailConfirmation'>;

export default function EmailConfirmationScreen({ route, navigation }: Props) {
  const { resendConfirmationEmail } = useAuth();
  const email = route.params?.email;
  const role = route.params?.role ?? 'attendee';
  const existingAccount = route.params?.existingAccount ?? false;
  const roleLabel =
    role === 'vendor' ? 'Vendor' : role === 'venue' ? 'Venue' : 'Attendee';
  const [isResending, setIsResending] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const handleResendEmail = async () => {
    if (!email) {
      setAlertState({ visible: true, title: 'Error', message: 'No email address found. Please sign up again.' });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        setAlertState({ visible: true, title: 'Error', message: error.message });
      } else {
        setAlertState({ visible: true, title: 'Success', message: 'Confirmation email resent! Please check your inbox.' });
      }
    } catch (error) {
      setAlertState({ visible: true, title: 'Error', message: 'Failed to resend email. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  if (existingAccount) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xl,
          }}
        >
          <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: radii.full,
                backgroundColor: '#fef3c7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <MaterialIcons name="warning" size={56} color="#f59e0b" />
            </View>

            <Text
              style={{
                ...typography.titleLarge,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              Email already in use
            </Text>

            <Text
              style={{
                ...typography.body,
                color: colors.textMuted,
                marginBottom: spacing.lg,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              An account with this email address already exists. Your account was not created because the email is already in use.
            </Text>

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
                <MaterialIcons name="email" size={20} color={colors.textPrimary} />
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
                Please log in with your existing credentials instead. If you have forgotten your password, use the reset password option.
              </Text>
            </View>

            <PrimaryButton title="Log in" onPress={() => navigation.navigate('SignIn')} />

            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={{
                marginTop: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <MaterialIcons name="arrow-back" size={16} color={colors.textPrimary} />
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                Use a different email
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {alertState && (
          <ThemedAlert
            visible={alertState.visible}
            title={alertState.title}
            message={alertState.message}
            buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
            onDismiss={() => setAlertState(null)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        }}
      >
        <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center', alignItems: 'center' }}>
          {/* Icon Container */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radii.full,
              backgroundColor: '#f2f7ff',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="mark-email-read" size={56} color={colors.textPrimary} />
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
              <MaterialIcons name="email" size={20} color={colors.textPrimary} />
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
              color={isResending ? colors.textMuted : colors.textPrimary}
            />
            <Text
              style={{
                ...typography.caption,
                color: isResending ? colors.textMuted : colors.textPrimary,
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

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
