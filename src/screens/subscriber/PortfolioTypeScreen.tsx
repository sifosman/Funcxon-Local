import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';

type ProfileStackParamList = {
  AccountMain: undefined;
  SubscriberSuite: undefined;
  SubscriberLogin: undefined;
  SubscriberProfile: undefined;
  PortfolioType: undefined;
  ApplicationStep1: undefined;
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

  const handleSelectType = (type: 'vendors' | 'venues') => {
    setPortfolioType(type);
    navigation.navigate('ApplicationStep1');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Create Portfolio
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
              Select the type of portfolio you want to create
            </Text>
          </View>

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
            {portfolioOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelectType(option.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.lg,
                  borderBottomWidth: index < portfolioOptions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderSubtle,
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radii.lg,
                      backgroundColor: option.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    <MaterialIcons name={option.icon} size={20} color={option.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                      {option.title}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
