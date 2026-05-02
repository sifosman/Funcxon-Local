import { useMemo } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@funcxon.com';
const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '+27000000000';

type AppFooterProps = {
  onNavigateToFAQs?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToHelpDesk?: () => void;
};

export function AppFooter({ onNavigateToFAQs, onNavigateToTerms, onNavigateToHelpDesk }: AppFooterProps) {
  const whatsappLink = useMemo(() => {
    const number = SUPPORT_WHATSAPP.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent('Hi, I need assistance with Funcxon.');
    return Platform.select({
      ios: `https://wa.me/${number}?text=${message}`,
      android: `whatsapp://send?phone=${number}&text=${message}`,
      default: `https://wa.me/${number}?text=${message}`,
    });
  }, []);

  const handleWhatsapp = () => {
    Linking.openURL(whatsappLink).catch(() => null);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20request`).catch(() => null);
  };

  const handleReportProblem = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Problem%20Report%20-%20Funcxon`).catch(() => null);
  };

  return (
    <View style={styles.container}>
      {/* Divider line */}
      <View style={styles.divider} />

      {/* Footer Content */}
      <View style={styles.content}>
        {/* Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>Funcxon</Text>
          <Text style={styles.brandTagline}>Your event planning companion</Text>
        </View>

        {/* Quick Links Section */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          {/* FAQ's */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={onNavigateToFAQs}
            disabled={!onNavigateToFAQs}
          >
            <MaterialIcons name="help-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>FAQ's</Text>
            <MaterialIcons 
              name="chevron-right" 
              size={18} 
              color={colors.textMuted} 
              style={styles.chevron}
            />
          </TouchableOpacity>

          {/* Help Desk */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={onNavigateToHelpDesk}
            disabled={!onNavigateToHelpDesk}
          >
            <MaterialIcons name="support-agent" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>Need app assistance? Contact our helpdesk</Text>
            <MaterialIcons 
              name="chevron-right" 
              size={18} 
              color={colors.textMuted} 
              style={styles.chevron}
            />
          </TouchableOpacity>

          {/* Report a Problem */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleReportProblem}
          >
            <MaterialIcons name="bug-report" size={18} color={colors.textSecondary} />
            <Text style={styles.linkText}>Report a problem to Funxon</Text>
            <MaterialIcons 
              name="chevron-right" 
              size={18} 
              color={colors.textMuted} 
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleWhatsapp}
          >
            <View style={[styles.iconCircle, styles.whatsappIcon]}>
              <MaterialIcons name="chat" size={16} color={colors.primaryForeground} />
            </View>
            <Text style={styles.contactText}>Chat via WhatsApp</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleEmail}
          >
            <View style={[styles.iconCircle, styles.emailIcon]}>
              <MaterialIcons name="email" size={16} color={colors.primaryForeground} />
            </View>
            <Text style={styles.contactText}>Chat Via email</Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Policies */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={onNavigateToTerms}
          disabled={!onNavigateToTerms}
        >
          <MaterialIcons name="gavel" size={16} color={colors.textMuted} />
          <Text style={styles.termsText}>Terms & Policies</Text>
        </TouchableOpacity>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Funcxon. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brandSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  brandName: {
    ...typography.titleMedium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  brandTagline: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  linksSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: radii.md,
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  contactSection: {
    marginBottom: spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  whatsappIcon: {
    backgroundColor: colors.primary,
  },
  emailIcon: {
    backgroundColor: colors.primary,
  },
  contactText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  termsText: {
    ...typography.body,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    textDecorationLine: 'underline',
  },
  copyright: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
