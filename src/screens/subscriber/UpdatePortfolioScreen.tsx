import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';

type ProfileStackParamList = {
    SubscriberProfile: undefined;
    UpdatePortfolio: undefined;
    UpdateVendorPortfolio: undefined;
    UpdateVenuePortfolio: undefined;
};

export default function UpdatePortfolioScreen() {
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
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Update Portfolio
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        Choose what you want to update
                    </Text>
                </View>

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
                        <TouchableOpacity
                            onPress={() => navigation.navigate('UpdateVendorPortfolio')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: spacing.lg,
                                borderBottomWidth: 1,
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
                                        backgroundColor: '#DBEAFE',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: spacing.md,
                                    }}
                                >
                                    <MaterialIcons name="store" size={20} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                                        Vendor / Service Portfolio
                                    </Text>
                                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                        Edit your vendor listing details
                                    </Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('UpdateVenuePortfolio')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: spacing.lg,
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: radii.lg,
                                        backgroundColor: '#EDE9FE',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: spacing.md,
                                    }}
                                >
                                    <MaterialIcons name="location-city" size={20} color="#7C3AED" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                                        Venue Portfolio
                                    </Text>
                                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                        Edit your venue listing details
                                    </Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
