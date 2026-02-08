import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, radii, typography } from '../theme';
import {
  privacyPolicy,
  cookiePolicy,
  dataProcessingAgreement,
  termsAndConditions,
} from '../config/legalContent';
import type { LegalDocument, LegalSection } from '../config/legalContent';

const documentMap: Record<string, LegalDocument> = {
  'privacy-policy': privacyPolicy,
  'cookie-policy': cookiePolicy,
  'data-processing-agreement': dataProcessingAgreement,
  'terms-and-conditions': termsAndConditions,
};

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {section.title}
      </Text>
      <Text
        style={{
          ...typography.body,
          color: colors.textSecondary,
          lineHeight: 22,
        }}
      >
        {section.content}
      </Text>
      {section.subsections?.map((sub, idx) => (
        <View key={idx} style={{ marginTop: spacing.md, paddingLeft: spacing.md }}>
          <Text
            style={{
              ...typography.body,
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            {sub.title}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            {sub.content}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function LegalDocumentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { documentId } = (route.params as { documentId: string }) || {};

  const document = documentMap[documentId];

  if (!document) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
          Document Not Found
        </Text>
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
          This legal document is not yet available. Please check back later.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: spacing.lg,
            backgroundColor: colors.primaryTeal,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
          }}
        >
          <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          {/* Header */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Title Card */}
          <View
            style={{
              backgroundColor: colors.primaryTeal,
              borderRadius: radii.lg,
              padding: spacing.xl,
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="shield" size={28} color="#FFFFFF" style={{ marginBottom: spacing.sm }} />
            <Text
              style={{
                ...typography.titleLarge,
                color: '#FFFFFF',
                marginBottom: spacing.xs,
              }}
            >
              {document.title}
            </Text>
            <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.8)' }}>
              Effective Date: {document.effectiveDate}
            </Text>
          </View>

          {/* Preamble */}
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
            <Text
              style={{
                ...typography.body,
                color: colors.textSecondary,
                lineHeight: 22,
                fontStyle: 'italic',
              }}
            >
              {document.preamble}
            </Text>
          </View>

          {/* Sections */}
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
            {document.sections.map((section, idx) => (
              <SectionBlock key={idx} section={section} />
            ))}
          </View>

          {/* Closing */}
          {document.closing && (
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
                name="info"
                size={20}
                color={colors.primaryTeal}
                style={{ marginRight: spacing.sm, marginTop: 2 }}
              />
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                  flex: 1,
                  lineHeight: 22,
                }}
              >
                {document.closing}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
