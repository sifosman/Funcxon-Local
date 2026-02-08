import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme';

const CONSENT_STORAGE_KEY = '@funcxon_data_consent_accepted';

export async function hasAcceptedDataConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setDataConsentAccepted(): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'true');
  } catch {
    // Silently fail - consent state won't persist but app continues
  }
}

interface DataConsentModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function DataConsentModal({ visible, onAccept }: DataConsentModalProps) {
  const [essentialAccepted, setEssentialAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);

  const canProceed = essentialAccepted;

  const handleAccept = async () => {
    await setDataConsentAccepted();
    onAccept();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
            elevation: 10,
          }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            bounces={false}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.borderSubtle,
                }}
              />
            </View>

            <View style={{ padding: spacing.xl }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#E0F2F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  <MaterialIcons name="verified-user" size={28} color={colors.primaryTeal} />
                </View>
                <Text style={{ ...typography.titleLarge, color: colors.textPrimary, textAlign: 'center' }}>
                  Your Privacy Matters
                </Text>
                <Text
                  style={{
                    ...typography.body,
                    color: colors.textMuted,
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    lineHeight: 22,
                  }}
                >
                  Funcxon is committed to protecting your personal information in compliance with the Protection of Personal Information Act (POPIA).
                </Text>
              </View>

              {/* What we collect */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md }}>
                  We collect and process your data for:
                </Text>
                {[
                  { icon: 'person' as const, text: 'Account creation and authentication' },
                  { icon: 'event' as const, text: 'Facilitating bookings and event planning' },
                  { icon: 'payment' as const, text: 'Processing payments securely' },
                  { icon: 'notifications' as const, text: 'Sending booking and payment notifications' },
                  { icon: 'security' as const, text: 'Fraud prevention and security' },
                ].map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < 4 ? spacing.sm : 0 }}>
                    <MaterialIcons name={item.icon} size={16} color={colors.primaryTeal} style={{ marginRight: spacing.sm }} />
                    <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Consent checkboxes */}
              <View style={{ marginBottom: spacing.lg }}>
                {/* Essential data processing - required */}
                <TouchableOpacity
                  onPress={() => setEssentialAccepted(!essentialAccepted)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: spacing.lg,
                    backgroundColor: colors.surface,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: essentialAccepted ? colors.primaryTeal : colors.borderSubtle,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: essentialAccepted ? colors.primaryTeal : colors.borderSubtle,
                      backgroundColor: essentialAccepted ? colors.primaryTeal : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    {essentialAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary }}>
                        Essential Data Processing
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.primaryTeal,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          marginLeft: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>REQUIRED</Text>
                      </View>
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, lineHeight: 18 }}>
                      I consent to the collection and processing of my personal information as necessary to provide platform services, including account management, bookings, and payments.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Analytics - optional */}
                <TouchableOpacity
                  onPress={() => setAnalyticsAccepted(!analyticsAccepted)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    backgroundColor: colors.surface,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: analyticsAccepted ? colors.primaryTeal : colors.borderSubtle,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: analyticsAccepted ? colors.primaryTeal : colors.borderSubtle,
                      backgroundColor: analyticsAccepted ? colors.primaryTeal : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    {analyticsAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary }}>
                        Analytics & Improvement
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.borderSubtle,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          marginLeft: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>OPTIONAL</Text>
                      </View>
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, lineHeight: 18 }}>
                      I consent to the use of analytics to help improve the platform experience, including usage patterns and performance data.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Info note */}
              <View
                style={{
                  backgroundColor: '#E0F2F7',
                  borderRadius: radii.md,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: spacing.lg,
                }}
              >
                <MaterialIcons name="info" size={18} color={colors.primaryTeal} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1, lineHeight: 18 }}>
                  You can review our full Privacy Policy and manage your consent preferences at any time in My Account {'>'} Terms & Policies. You may withdraw consent by contacting our Information Officer.
                </Text>
              </View>

              {/* Accept button */}
              <TouchableOpacity
                onPress={handleAccept}
                disabled={!canProceed}
                style={{
                  backgroundColor: canProceed ? colors.primaryTeal : colors.borderSubtle,
                  paddingVertical: spacing.md + 2,
                  borderRadius: radii.lg,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check-circle" size={20} color={canProceed ? '#FFFFFF' : colors.textMuted} style={{ marginRight: spacing.sm }} />
                <Text
                  style={{
                    ...typography.body,
                    color: canProceed ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  Accept & Continue
                </Text>
              </TouchableOpacity>

              {!canProceed && (
                <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }}>
                  Please accept essential data processing to continue
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
