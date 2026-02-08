import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { legalDocumentIndex } from '../config/legalContent';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

export default function TermsAndPoliciesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back to My Account
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="shield" size={28} color={colors.primaryTeal} style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>
              Terms & Policies
            </Text>
          </View>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            Review our legal documents and data protection policies
          </Text>
        </View>

        {/* POPIA Notice */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <View
            style={{
              backgroundColor: '#E0F2F7',
              borderRadius: radii.lg,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <MaterialIcons
              name="verified-user"
              size={24}
              color={colors.primaryTeal}
              style={{ marginRight: spacing.md, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                POPIA Compliant
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 18 }}>
                Funcxon is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
              </Text>
            </View>
          </View>
        </View>

        {/* Document List */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View
            style={{
              borderRadius: radii.lg,
              overflow: 'hidden',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
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
                    borderBottomColor: colors.borderSubtle,
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
                        <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                          {doc.title}
                        </Text>
                        {isComingSoon && (
                          <View
                            style={{
                              backgroundColor: colors.borderSubtle,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: radii.sm,
                              marginLeft: spacing.sm,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>
                              COMING SOON
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
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
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
              Information Officer
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 20 }}>
              Name: Zulayka Bhyat{'\n'}
              Email: zulaykab@gmail.com{'\n'}
              Address: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936
            </Text>
            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 20 }}>
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
