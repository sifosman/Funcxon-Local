import { useMemo, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../utils/env';
import { supabase } from '../lib/supabaseClient';

type AppFooterProps = {
  onNavigateToFAQs?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToHelpDesk?: () => void;
};

export function AppFooter({ onNavigateToFAQs, onNavigateToTerms, onNavigateToHelpDesk }: AppFooterProps) {
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const whatsappLink = useMemo(() => {
    const number = SUPPORT_WHATSAPP.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent('Hi, I need assistance with Funxon.');
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
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Problem%20Report%20-%20Funxon`).catch(() => null);
  };

  const handleOpenReview = () => {
    setReviewRating(0);
    setReviewComment('');
    setReviewSubmitted(false);
    setReviewModalVisible(true);
  };

  const handleCloseReview = () => {
    setReviewModalVisible(false);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      const payload: any = {
        rating: reviewRating,
        review_text: reviewComment.trim() || null,
        status: 'pending',
      };
      if (userId) {
        payload.user_id = userId;
      }
      const { error } = await supabase.from('app_reviews').insert(payload);
      if (error) throw error;
      setReviewSubmitted(true);
    } catch (err) {
      console.error('Failed to submit app review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Divider line */}
      <View style={styles.divider} />

      {/* Footer Content */}
      <View style={styles.content}>
        {/* Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>Funxon</Text>
          <Text style={styles.brandTagline}>Connect Collaborate Celebrate</Text>
          <TouchableOpacity
            onPress={handleOpenReview}
            style={{
              marginTop: spacing.sm,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
            }}
          >
            <MaterialIcons name="star" size={16} color="#FFFFFF" />
            <Text style={{ ...typography.captionSemiBold, color: '#FFFFFF', marginLeft: spacing.xs }}>
              Submit a Funxon App Review
            </Text>
          </TouchableOpacity>
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
          © {new Date().getFullYear()} Funxon. All rights reserved.
        </Text>
      </View>

      {/* App Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="fade" onRequestClose={handleCloseReview}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, width: '100%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                {reviewSubmitted ? 'Thank You!' : 'Rate Funxon'}
              </Text>
              <TouchableOpacity onPress={handleCloseReview}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {reviewSubmitted ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <MaterialIcons name="check-circle" size={48} color={colors.primary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md }}>
                  Thank you for reviewing the app. We will contact you.
                </Text>
                <TouchableOpacity
                  onPress={handleCloseReview}
                  style={{ marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.primary }}
                >
                  <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  How would you rate your experience with the Funxon app?
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                      <MaterialIcons
                        name={star <= reviewRating ? 'star' : 'star-border'}
                        size={32}
                        color={star <= reviewRating ? '#F59E0B' : colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                    Comments (optional)
                  </Text>
                  <TextInput
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Tell us what you think..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: colors.surfaceMuted,
                      color: colors.textPrimary,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={reviewRating === 0 || reviewSubmitting}
                  style={{
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: reviewRating === 0 || reviewSubmitting ? colors.surfaceMuted : colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.bodySemiBold, color: reviewRating === 0 || reviewSubmitting ? colors.textMuted : '#FFFFFF' }}>
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
