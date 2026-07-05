import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../../lib/applicationService';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  AccountMain: undefined;
  SubscriberSuite: undefined;
  SubscriberLogin: undefined;
  SubscriberProfile: undefined;
  PortfolioType: undefined;
  ApplicationStep1: undefined;
  ApplicationStatus: undefined;
};

interface PortfolioOption {
  id: 'vendors' | 'venues';
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
}

export default function PortfolioTypeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();
  const { setPortfolioType } = useApplicationForm();


  const portfolioOptions: PortfolioOption[] = [
    {
      id: 'vendors',
      title: 'Vendors / Service Professionals',
      description: 'Create a portfolio for your vendor or service professional business',
      icon: 'people',
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
    },
    {
      id: 'venues',
      title: 'Venues',
      description: 'Create a portfolio to showcase your venue',
      icon: 'business',
      iconColor: '#7C3AED',
      iconBg: '#EDE9FE',
    },
  ];

  const handleSelectType = async (type: 'vendors' | 'venues') => {
    console.log('PortfolioTypeScreen - User selected:', type);
    const portfolioType = type === 'vendors' ? 'vendor' : 'venue';
    const latestApplication = await getLatestUserApplicationByType(portfolioType);
    
    if (latestApplication.success && latestApplication.data && isBlockingApplicationStatus(latestApplication.data.status)) {
      navigation.replace('ApplicationStatus');
      return;
    }
    
    console.log('PortfolioTypeScreen - Setting portfolio type to:', type);
    await setPortfolioType(type);
    console.log('PortfolioTypeScreen - Portfolio type set, navigating to ApplicationStep1');
    navigation.navigate('ApplicationStep1');
  };

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
  };

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderHeader = (isDesktopHeader: boolean) => (
    <View style={isDesktopHeader ? { marginBottom: spacing.xl, textAlign: 'center' } as any : { alignItems: 'center', marginBottom: spacing.xl }}>
      <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm, textAlign: 'center' } as any : { display: 'none' } as any}>
        Create Portfolio
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary, textAlign: 'center' } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' }}>
        Create Portfolio
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted, textAlign: 'center' }}>
        Select the type of portfolio you want to create
      </Text>
    </View>
  );

  const renderOptions = () => (
    <View
      style={{
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: cardSurface,
        borderWidth: 1,
        borderColor: cardBorder,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {portfolioOptions.map((option, index) => (
        <TouchableOpacity
          key={option.id}
          onPress={() => handleSelectType(option.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isDesktop ? spacing.lg : spacing.lg,
            borderBottomWidth: index < portfolioOptions.length - 1 ? 1 : 0,
            borderBottomColor: cardBorder,
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: isDesktop ? 48 : 40,
                height: isDesktop ? 48 : 40,
                borderRadius: radii.lg,
                backgroundColor: option.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <MaterialIcons name={option.icon} size={isDesktop ? 24 : 20} color={option.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodyMedium, color: colors.textPrimary }}>
                {option.title}
              </Text>
              <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                {option.description}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={isDesktop ? 24 : 20} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl, paddingTop: spacing.lg } as any : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader(true)}
            <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' } as any}>
              {renderOptions()}
            </View>
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                  Back
                </Text>
              </TouchableOpacity>

              {renderHeader(false)}
              {renderOptions()}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
