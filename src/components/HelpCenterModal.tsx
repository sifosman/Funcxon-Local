import { useMemo, useState } from 'react';
import { Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP, SUPPORT_PHONE } from '../utils/env';
import ThemedAlert from './ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';

type HelpCenterModalProps = {
  visible: boolean;
  onClose: () => void;
  onNavigateToHelp?: () => void;
  onDeleteAccount?: () => void;
  userRole?: 'attendee' | 'vendor' | null;
};

export function HelpCenterModal({ visible, onClose, onNavigateToHelp, onDeleteAccount, userRole }: HelpCenterModalProps) {
  const [alertVisible, setAlertVisible] = useState(false);
  const isAttendee = userRole === 'attendee';
  const isDesktop = useIsDesktop();

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
    if (!whatsappLink) return;
    Linking.openURL(whatsappLink).catch(() => null);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20request`).catch(() => null);
  };

  const handlePhone = () => {
    const clean = SUPPORT_PHONE.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => null);
  };

  const handleRequestManager = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Portfolio%20manager%20request`).catch(() => null);
  };

  const handleDeleteAccount = () => {
    setAlertVisible(true);
  };

  /* ─── Desktop Layout: right-side slide-in panel ─── */
  const desktopModal = (
    <Modal animationType="slide" visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.desktopBackdrop}>
        <View style={styles.desktopPanel}>
          <View style={styles.header}>
            <Text style={styles.title}>Help Desk</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.desktopContent} bounces={false}>
            <View style={styles.desktopGrid}>
              {/* Help Center */}
              <View style={[styles.card, styles.desktopCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCirclePrimary}>
                    <MaterialIcons name="chat-bubble-outline" size={18} color={colors.primaryForeground} />
                  </View>
                  <Text style={styles.cardTitle}>Help Center</Text>
                </View>
                <Text style={styles.cardBody}>
                  Browse FAQs for quick answers about quotes, portfolio creation, billing, and bookings.
                </Text>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => {
                    onClose();
                    onNavigateToHelp?.();
                  }}
                >
                  <Text style={styles.chipText}>View FAQs</Text>
                </TouchableOpacity>
              </View>

              {/* Contact Support */}
              <View style={[styles.card, styles.desktopCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircleGreen}>
                    <MaterialIcons name="support-agent" size={18} color={colors.primaryForeground} />
                  </View>
                  <Text style={styles.cardTitle}>Contact Support</Text>
                </View>
                <Text style={styles.cardBody}>Chat with our help desk team, call us, or send an email.</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleWhatsapp}>
                    <MaterialIcons name="chat" size={18} color={colors.primaryForeground} />
                    <Text style={styles.primaryBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handlePhone}>
                    <MaterialIcons name="phone" size={18} color={colors.textPrimary} />
                    <Text style={styles.secondaryBtnText}>Call us</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleEmail}>
                    <MaterialIcons name="email" size={18} color={colors.textPrimary} />
                    <Text style={styles.secondaryBtnText}>Email us</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Portfolio Manager */}
              <View style={[styles.card, styles.desktopCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCirclePurple}>
                    <MaterialIcons name="person-pin" size={18} color={colors.primaryForeground} />
                  </View>
                  <Text style={styles.cardTitle}>Dedicated Portfolio Manager</Text>
                </View>
                <Text style={styles.cardBody}>
                  {isAttendee
                    ? "Need help planning your event? Request a dedicated portfolio manager to help you find the perfect venues and vendors."
                    : "Get personalised guidance on portfolio setup, profile edits, ad placements, and troubleshooting."}
                </Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleRequestManager}>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Request a manager</Text>
                </TouchableOpacity>
              </View>

              {/* Account Management — attendees only (listers use admin request flow) */}
              {userRole !== 'vendor' && (
              <View style={[styles.card, styles.desktopCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircleRed}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.primaryForeground} />
                  </View>
                  <Text style={styles.cardTitle}>Account Management</Text>
                </View>
                <Text style={styles.cardBody}>
                  Request account deletion. Our admin team will review and process your request within 48 hours.
                </Text>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
                  <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                  <Text style={styles.dangerBtnText}>Request Deletion</Text>
                </TouchableOpacity>
              </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  /* ─── Mobile Layout: bottom sheet (unchanged) ─── */
  const mobileModal = (
    <Modal animationType="slide" visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Help Desk</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCirclePrimary}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color={colors.primaryForeground} />
                </View>
                <Text style={styles.cardTitle}>Help Center</Text>
              </View>
              <Text style={styles.cardBody}>
                Browse FAQs for quick answers about quotes, portfolio creation, billing, and bookings.
              </Text>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  onClose();
                  onNavigateToHelp?.();
                }}
              >
                <Text style={styles.chipText}>View FAQs</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleGreen}>
                  <MaterialIcons name="support-agent" size={18} color={colors.primaryForeground} />
                </View>
                <Text style={styles.cardTitle}>Contact Support</Text>
              </View>
              <Text style={styles.cardBody}>Chat with our help desk team, call us, or send an email.</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleWhatsapp}>
                  <MaterialIcons name="chat" size={18} color={colors.primaryForeground} />
                  <Text style={styles.primaryBtnText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handlePhone}>
                  <MaterialIcons name="phone" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Call us</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleEmail}>
                  <MaterialIcons name="email" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Email us</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCirclePurple}>
                  <MaterialIcons name="person-pin" size={18} color={colors.primaryForeground} />
                </View>
                <Text style={styles.cardTitle}>Dedicated Portfolio Manager</Text>
              </View>
              <Text style={styles.cardBody}>
                {isAttendee
                  ? "Need help planning your event? Request a dedicated portfolio manager to help you find the perfect venues and vendors."
                  : "Get personalised guidance on portfolio setup, profile edits, ad placements, and troubleshooting."}
              </Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleRequestManager}>
                <MaterialIcons name="arrow-forward" size={18} color={colors.textPrimary} />
                <Text style={styles.secondaryBtnText}>Request a manager</Text>
              </TouchableOpacity>
            </View>

            {userRole !== 'vendor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleRed}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.primaryForeground} />
                </View>
                <Text style={styles.cardTitle}>Account Management</Text>
              </View>
              <Text style={styles.cardBody}>
                Request account deletion. Our admin team will review and process your request within 48 hours.
              </Text>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
                <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                <Text style={styles.dangerBtnText}>Request Deletion</Text>
              </TouchableOpacity>
            </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
    {isDesktop ? desktopModal : mobileModal}
    <ThemedAlert
      visible={alertVisible}
      title="Request Account Deletion"
      message="Your request will be sent to our admin team for review. Your account and data will be permanently deleted once approved (usually within 48 hours). Continue?"
      buttons={[
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
        { text: 'Submit Request', style: 'destructive', onPress: () => { setAlertVisible(false); onDeleteAccount?.(); } }
      ]}
      onDismiss={() => setAlertVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  iconCirclePrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#22C55E',
    gap: spacing.xs,
  },
  primaryBtnText: {
    ...typography.body,
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#DC2626',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dangerBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  desktopBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  desktopPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
    width: 420,
    maxWidth: '90%',
    height: '100%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: -8, height: 0 },
    elevation: 20,
  },
  desktopContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  desktopCard: {
    flex: 1,
    minWidth: '46%',
  },
});
