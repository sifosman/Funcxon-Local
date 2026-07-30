import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { useIsDesktop } from '../hooks/useIsDesktop';

type RouteParams = {
  email: string;
  fullName: string;
  tierName: string;
  productType?: 'vendor' | 'venue';
  businessName?: string;
};

export default function VendorSignupSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { setPortfolioType } = useApplicationForm();

  const { email, fullName, tierName, productType, businessName } = (route.params ?? {}) as RouteParams;

  useEffect(() => {
    // Send welcome email and admin notification when screen loads
    sendWelcomeEmail();
    sendAdminNotification();
  }, []);

  const sendWelcomeEmail = async () => {
    try {
      if (!email || !fullName || !tierName) {
        console.log('Missing required fields for welcome email');
        return;
      }

      const isVenue = productType === 'venue';
      const functionName = isVenue ? 'send-venue-welcome-email' : 'send-vendor-welcome-email';
      const applicationUrl = isVenue ? 'https://funxon.co.za/venue-application' : 'https://funxon.co.za/vendor-application';
      const catalogueUrl = isVenue ? 'https://funxon.co.za/venue-catalogue' : 'https://funxon.co.za/vendor-catalogue';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          email,
          fullName,
          tierName,
          applicationUrl,
          catalogueUrl,
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

  const sendAdminNotification = async () => {
    try {
      if (!email || !fullName || !tierName) {
        console.log('Missing required fields for admin notification');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'vendor-free-signup',
          vendorName: fullName,
          vendorEmail: email,
          businessName: businessName || undefined,
          tierName: tierName,
          portfolioType: productType || 'vendor',
        },
      });

      if (error) {
        console.error('Error sending admin notification:', error);
        return;
      }

      console.log('Admin notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  };

  const handleContinueApplication = async () => {
    // Determine portfolio type based on productType (defaults to vendors if not specified)
    const portfolioType = productType === 'venue' ? 'venues' : 'vendors';
    console.log('VendorSignupSuccessScreen - Setting portfolio type to:', portfolioType);
    await setPortfolioType(portfolioType);
    console.log('VendorSignupSuccessScreen - Navigating to ApplicationStep1');
    navigation.navigate('ApplicationStep1');
  };

  const handleGoHome = () => {
    navigation.navigate('AccountMain');
  };

  const renderContent = (desktop: boolean) => (
    <View style={{ width: '100%', maxWidth: desktop ? 640 : 480, alignSelf: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: desktop ? spacing.xxl : spacing.xl }}>
        {/* Success Icon */}
        <View
          style={{
            width: desktop ? 120 : 100,
            height: desktop ? 120 : 100,
            borderRadius: desktop ? 60 : 50,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <MaterialIcons name="check" size={desktop ? 60 : 50} color={colors.primaryForeground} />
        </View>

        <Text style={{ ...(desktop ? typography.headlineMd : typography.displayMedium), color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md }}>
          Welcome to Funxon!
        </Text>

        <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }}>
          Hi {fullName || 'there'},
        </Text>

        <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textSecondary, textAlign: 'center' }}>
          You've successfully signed up for the{' '}
          <Text style={{ ...(desktop ? typography.bodyMd : typography.body), fontWeight: '700', color: colors.primary }}>{(tierName || '').toUpperCase()}</Text>
          {' '}plan.
        </Text>
      </View>

      {/* Info Cards */}
      <View
        style={{
          backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
          borderRadius: radii.lg,
          padding: desktop ? spacing.xl : spacing.lg,
          borderWidth: 1,
          borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <MaterialIcons name="email" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
          <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textPrimary, flex: 1 }}>
            Check your email at <Text style={{ ...typography.bodySemiBold }}>{email}</Text> for next steps
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="list-alt" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
          <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textPrimary, flex: 1 }}>
            Complete your vendor application to start receiving bookings
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: spacing.md } as any}>
        <TouchableOpacity
          onPress={handleContinueApplication}
          activeOpacity={0.9}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radii.lg,
            paddingVertical: desktop ? spacing.lg : spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ ...typography.bodyBold, color: colors.primaryForeground }}>
            Complete Your Application
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.9}
          style={{
            backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
            borderRadius: radii.lg,
            paddingVertical: desktop ? spacing.lg : spacing.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email Note */}
      <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
        Didn't receive the email? Check your spam folder or contact support@funxon.co.za
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: 48 }}>
          <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
            {renderContent(true)}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}>
          {renderContent(false)}
        </ScrollView>
      )}
    </View>
  );
}
