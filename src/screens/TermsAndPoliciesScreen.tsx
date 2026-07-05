import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { legalDocumentIndex } from '../config/legalContent';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

export default function TermsAndPoliciesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { paddingBottom: spacing.xl, maxWidth: 800, width: '100%', alignSelf: 'center', paddingHorizontal: 48 } : { paddingBottom: spacing.xl }}>
        {/* Header */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          {isDesktop ? null : (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Back to My Account
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="shield" size={isDesktop ? 36 : 28} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, fontSize: isDesktop ? 32 : undefined }}>
              Terms & Policies
            </Text>
          </View>
          <Text style={{ ...typography.body, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, fontSize: isDesktop ? 16 : undefined, lineHeight: isDesktop ? 24 : undefined }}>
            Review our legal documents and data protection policies
          </Text>
        </View>

        {/* POPIA Notice */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, marginBottom: spacing.lg }}>
          <View
            style={{
              backgroundColor: isDesktop ? colors.surfaceContainerLow : '#f2f7ff',
              borderRadius: radii.lg,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'flex-start',
              borderWidth: isDesktop ? 1 : 0,
              borderColor: isDesktop ? colors.outlineVariant : undefined,
            }}
          >
            <MaterialIcons
              name="verified-user"
              size={24}
              color={colors.textPrimary}
              style={{ marginRight: spacing.md, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.xs, fontSize: isDesktop ? 16 : undefined }}>
                POPIA Compliant
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: isDesktop ? 24 : 18, fontSize: isDesktop ? 14 : undefined }}>
                Funxon is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
              </Text>
            </View>
          </View>
        </View>

        {/* Document List */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
          <View
            style={{
              borderRadius: radii.lg,
              overflow: 'hidden',
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            {legalDocumentIndex.map((doc, index) => {
              const isComingSoon = 'comingSoon' in doc && doc.comingSoon;
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => {
                    if (!isComingSoon) {
                      navigation.navigate('LegalDocument', { documentId: doc.id });
                    }
                  }}
                  disabled={isComingSoon}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.lg,
                    borderBottomWidth: index < legalDocumentIndex.length - 1 ? 1 : 0,
                    borderBottomColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                    opacity: isComingSoon ? 0.5 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radii.lg,
                        backgroundColor: doc.iconBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: spacing.md,
                      }}
                    >
                      <MaterialIcons name={doc.icon} size={22} color={doc.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, fontSize: isDesktop ? 16 : undefined }}>
                          {doc.title}
                        </Text>
                        {isComingSoon && (
                          <View
                            style={{
                              backgroundColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: radii.sm,
                              marginLeft: spacing.sm,
                            }}
                          >
                            <Text style={{ ...typography.captionBold, fontSize: 9, color: colors.textMuted }}>
                              COMING SOON
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2, fontSize: isDesktop ? 14 : undefined }}>
                        {doc.description}
                      </Text>
                    </View>
                  </View>
                  {!isComingSoon && (
                    <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Contact Info */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, marginTop: spacing.lg }}>
          <View
            style={{
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.sm, fontSize: isDesktop ? 16 : undefined }}>
              Information Officer
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: isDesktop ? 24 : 20, fontSize: isDesktop ? 14 : undefined }}>
              Name: Zulayka Bhyat{'\n'}
              Email: zulaykab@gmail.com{'\n'}
              Address: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936
            </Text>
            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: isDesktop ? colors.outlineVariant : colors.borderSubtle }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: isDesktop ? 24 : 20, fontSize: isDesktop ? 14 : undefined }}>
                Information Regulator:{'\n'}
                Email: complaints.IR@justice.gov.za
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
