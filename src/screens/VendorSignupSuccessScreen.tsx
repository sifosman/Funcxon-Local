import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

type RouteParams = {
  email: string;
  fullName: string;
  tierName: string;
};

export default function VendorSignupSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();

  const { email, fullName, tierName } = (route.params ?? {}) as RouteParams;

  useEffect(() => {
    // Send welcome email when screen loads
    sendWelcomeEmail();
  }, []);

  const sendWelcomeEmail = async () => {
    try {
      if (!email || !fullName || !tierName) {
        console.log('Missing required fields for welcome email');
        return;
      }

      // Get the edge function URL
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-vendor-welcome-email', {
        body: {
          email,
          fullName,
          tierName,
          applicationUrl: 'https://funcxon.com/vendor-application',
        },
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return;
      }

      console.log('Welcome email sent successfully:', data);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  };

  const handleContinueApplication = () => {
    navigation.navigate('ApplicationStep1');
  };

  const handleGoHome = () => {
    navigation.navigate('AccountMain');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          {/* Success Icon */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="check" size={50} color={colors.primaryForeground} />
          </View>

          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md }}>
            Welcome to Funcxon!
          </Text>

          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }}>
            Hi {fullName || 'there'},
          </Text>

          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
            You've successfully signed up for the{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>{(tierName || '').toUpperCase()}</Text>
            {' '}plan.
          </Text>
        </View>

        {/* Info Cards */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            marginBottom: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <MaterialIcons name="email" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
              Check your email at <Text style={{ fontWeight: '600' }}>{email}</Text> for next steps
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="list-alt" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
              Complete your vendor application to start receiving bookings
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: spacing.md }}>
          <TouchableOpacity
            onPress={handleContinueApplication}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '700' }}>
              Complete Your Application
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoHome}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
              Go to Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Note */}
        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
          Didn't receive the email? Check your spam folder or contact support@funcxon.com
        </Text>
      </ScrollView>
    </View>
  );
}
