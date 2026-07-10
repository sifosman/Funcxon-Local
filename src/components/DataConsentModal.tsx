import { useState } from 'react';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

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
  const isDesktop = useIsDesktop();

  const canProceed = essentialAccepted;

  const handleAccept = async () => {
    await setDataConsentAccepted();
    onAccept();
  };

  const dataItems = [
    { icon: 'person' as const, text: 'Account creation and authentication' },
    { icon: 'event' as const, text: 'Facilitating bookings and event planning' },
    { icon: 'payment' as const, text: 'Processing payments securely' },
    { icon: 'notifications' as const, text: 'Sending booking and payment notifications' },
    { icon: 'security' as const, text: 'Fraud prevention and security' },
  ];

  /* ─── Desktop Layout: centered dialog with branded sidebar ─── */
  if (isDesktop) {
    return (
      <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              width: '90%',
              maxWidth: 880,
              maxHeight: '85%',
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 8 },
              elevation: 20,
            }}
          >
            {/* Branded left panel */}
            <View
              style={{
                width: 280,
                backgroundColor: colors.primary,
                padding: spacing.xxl,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                  }}
                >
                  <MaterialIcons name="verified-user" size={24} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    fontFamily: 'Montserrat_700Bold',
                    color: '#FFFFFF',
                    lineHeight: 32,
                    marginBottom: spacing.md,
                  }}
                >
                  Your Privacy Matters
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_400Regular',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 22,
                  }}
                >
                  Funxon is committed to protecting your personal information in compliance with POPIA.
                </Text>
              </View>

              <View>
                {dataItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: idx < dataItems.length - 1 ? spacing.md : 0,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: spacing.md,
                      }}
                    >
                      <MaterialIcons name={item.icon} size={14} color="#FFFFFF" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Montserrat_400Regular',
                        color: 'rgba(255,255,255,0.85)',
                        flex: 1,
                        lineHeight: 16,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Montserrat_400Regular',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: spacing.lg,
                }}
              >
                Protection of Personal Information Act (POPIA) Compliant
              </Text>
            </View>

            {/* Right content panel */}
            <View style={{ flex: 1, padding: spacing.xxl }}>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    fontFamily: 'Montserrat_700Bold',
                    color: colors.onSurface,
                    marginBottom: spacing.sm,
                  }}
                >
                  Consent Preferences
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_400Regular',
                    color: colors.onSurfaceVariant,
                    lineHeight: 22,
                    marginBottom: spacing.xl,
                  }}
                >
                  Please review and accept the following to continue using Funxon.
                </Text>

                {/* Essential consent */}
                <TouchableOpacity
                  onPress={() => setEssentialAccepted(!essentialAccepted)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: spacing.lg,
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1.5,
                    borderColor: essentialAccepted ? colors.primary : colors.outlineVariant,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: essentialAccepted ? colors.primary : colors.outlineVariant,
                      backgroundColor: essentialAccepted ? colors.primary : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                      marginTop: 2,
                    }}
                  >
                    {essentialAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurface }}>
                        Essential Data Processing
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          marginLeft: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Montserrat_700Bold' }}>REQUIRED</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, fontFamily: 'Montserrat_400Regular', color: colors.onSurfaceVariant, lineHeight: 20 }}>
                      I consent to the collection and processing of my personal information as necessary to provide platform services, including account management, bookings, and payments.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Analytics consent */}
                <TouchableOpacity
                  onPress={() => setAnalyticsAccepted(!analyticsAccepted)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1.5,
                    borderColor: analyticsAccepted ? colors.primary : colors.outlineVariant,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: analyticsAccepted ? colors.primary : colors.outlineVariant,
                      backgroundColor: analyticsAccepted ? colors.primary : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                      marginTop: 2,
                    }}
                  >
                    {analyticsAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurface }}>
                        Analytics & Improvement
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.outlineVariant,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          marginLeft: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant, fontFamily: 'Montserrat_700Bold' }}>OPTIONAL</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, fontFamily: 'Montserrat_400Regular', color: colors.onSurfaceVariant, lineHeight: 20 }}>
                      I consent to the use of analytics to help improve the platform experience, including usage patterns and performance data.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Info note */}
                <View
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginTop: spacing.lg,
                    marginBottom: spacing.xl,
                  }}
                >
                  <MaterialIcons name="info" size={18} color={colors.primary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                  <Text style={{ fontSize: 12, fontFamily: 'Montserrat_400Regular', color: colors.onSurface, flex: 1, lineHeight: 18 }}>
                    You can review our full Privacy Policy and manage your consent preferences at any time in My Account {'>'} Terms & Policies. You may withdraw consent by contacting our Information Officer.
                  </Text>
                </View>

                {/* Accept button */}
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={!canProceed}
                  style={{
                    backgroundColor: canProceed ? colors.primary : colors.outlineVariant,
                    paddingVertical: spacing.md + 2,
                    borderRadius: radii.lg,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="check-circle" size={20} color={canProceed ? '#FFFFFF' : colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      fontFamily: 'Montserrat_700Bold',
                      color: canProceed ? '#FFFFFF' : colors.onSurfaceVariant,
                    }}
                  >
                    Accept & Continue
                  </Text>
                </TouchableOpacity>

                {!canProceed && (
                  <Text style={{ fontSize: 12, fontFamily: 'Montserrat_400Regular', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }}>
                    Please accept essential data processing to continue
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  /* ─── Mobile Layout: bottom sheet (unchanged) ─── */
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
                    backgroundColor: '#f2f7ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  <MaterialIcons name="verified-user" size={28} color={colors.textPrimary} />
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
                  Funxon is committed to protecting your personal information in compliance with the Protection of Personal Information Act (POPIA).
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
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.md }}>
                  We collect and process your data for:
                </Text>
                {dataItems.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < 4 ? spacing.sm : 0 }}>
                    <MaterialIcons name={item.icon} size={16} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
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
                    borderColor: essentialAccepted ? colors.cta : colors.borderSubtle,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: essentialAccepted ? colors.cta : colors.borderSubtle,
                      backgroundColor: essentialAccepted ? colors.cta : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    {essentialAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                        Essential Data Processing
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.accentBright,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          marginLeft: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textPrimary }}>REQUIRED</Text>
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
                    borderColor: analyticsAccepted ? colors.cta : colors.borderSubtle,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: analyticsAccepted ? colors.cta : colors.borderSubtle,
                      backgroundColor: analyticsAccepted ? colors.cta : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    {analyticsAccepted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
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
                  backgroundColor: '#f2f7ff',
                  borderRadius: radii.md,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: spacing.lg,
                }}
              >
                <MaterialIcons name="info" size={18} color={colors.textPrimary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1, lineHeight: 18 }}>
                  You can review our full Privacy Policy and manage your consent preferences at any time in My Account {'>'} Terms & Policies. You may withdraw consent by contacting our Information Officer.
                </Text>
              </View>

              {/* Accept button */}
              <TouchableOpacity
                onPress={handleAccept}
                disabled={!canProceed}
                style={{
                  backgroundColor: canProceed ? colors.cta : colors.borderSubtle,
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
