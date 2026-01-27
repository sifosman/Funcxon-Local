import { useMemo } from 'react';
import { Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';

type HelpCenterModalProps = {
  visible: boolean;
  onClose: () => void;
};

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@funcxon.com';
const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '+27000000000';

export function HelpCenterModal({ visible, onClose }: HelpCenterModalProps) {
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
    if (!whatsappLink) return;
    Linking.openURL(whatsappLink).catch(() => null);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20request`).catch(() => null);
  };

  return (
    <Modal animationType="slide" visible={visible} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Need help?</Text>
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
              <TouchableOpacity style={styles.chip}>
                <Text style={styles.chipText}>View FAQs (coming soon)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleGreen}>
                  <MaterialIcons name="support-agent" size={18} color={colors.primaryForeground} />
                </View>
                <Text style={styles.cardTitle}>Contact Support</Text>
              </View>
              <Text style={styles.cardBody}>Chat with our help desk team or send us an email.</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleWhatsapp}>
                  <MaterialIcons name="chat" size={18} color={colors.primaryForeground} />
                  <Text style={styles.primaryBtnText}>WhatsApp</Text>
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
                Get personalised guidance on portfolio setup, profile edits, ad placements, and troubleshooting.
              </Text>
              <TouchableOpacity style={styles.secondaryBtn}>
                <MaterialIcons name="arrow-forward" size={18} color={colors.textPrimary} />
                <Text style={styles.secondaryBtnText}>Request a manager (coming soon)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
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
});
