import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useApplicationForm } from '../context/ApplicationFormContext';
import ThemedAlert from '../components/ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';

// Dev mode - accepts any credentials
const DEV_MODE = __DEV__;

export default function SubscriberLoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const isDesktop = useIsDesktop();
    const { resetForm, setPortfolioType } = useApplicationForm();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

    const handleRegisterPortfolio = (type: 'venues' | 'vendors') => {
        resetForm();
        setPortfolioType(type);
        navigation.navigate('ApplicationStep1');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setAlertState({ visible: true, title: 'Missing details', message: 'Please enter both email and password.' });
            return;
        }

        if (DEV_MODE) {
            // In dev mode, accept any credentials
            console.log('Dev mode: Accepting any credentials');
            navigation.navigate('SubscriberProfile');
            return;
        }

        // Email format validation for production
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setAlertState({ visible: true, title: 'Invalid email', message: 'Please enter a valid email address.' });
            return;
        }

        setLoading(true);

        // TODO: Real authentication logic here
        // For now, just navigate to profile
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('SubscriberProfile');
        }, 500);
    };

    const renderCard = (desktop: boolean) => (
        <View
            style={{
                maxWidth: desktop ? 480 : 400,
                alignSelf: 'center',
                width: '100%',
                backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                shadowColor: desktop ? undefined : '#000',
                shadowOpacity: desktop ? undefined : 0.05,
                shadowRadius: desktop ? undefined : 8,
                shadowOffset: desktop ? undefined : { width: 0, height: 2 },
                elevation: desktop ? undefined : 2,
                padding: desktop ? spacing.xxl : spacing.xl,
            }}
        >
            {/* Header */}
            <View style={{ marginBottom: desktop ? spacing.xl : spacing.xl }}>
                <Text style={{ ...(desktop ? typography.headlineMd : typography.titleLarge), color: colors.textPrimary, marginBottom: spacing.xs }}>
                    Subscriber Portal
                </Text>
                <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textMuted }}>
                    Access your business profile and manage your listings
                </Text>
                {DEV_MODE && (
                    <View
                        style={{
                            marginTop: spacing.md,
                            padding: spacing.sm,
                            backgroundColor: '#FEF3C7',
                            borderRadius: radii.md,
                            borderWidth: 1,
                            borderColor: '#FCD34D',
                        }}
                    >
                        <Text style={{ ...typography.caption, color: '#92400E' }}>
                            🔧 Dev Mode: Any email/password will work
                        </Text>
                    </View>
                )}
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...(desktop ? typography.labelMd : typography.body), color: colors.textPrimary, marginBottom: spacing.xs }}>Email</Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                        backgroundColor: colors.inputBackground,
                        paddingHorizontal: spacing.md,
                    }}
                >
                    <MaterialIcons name="mail-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="your@email.com"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            flex: 1,
                            paddingVertical: spacing.sm,
                            color: colors.textPrimary,
                            fontSize: 14,
                        }}
                    />
                </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...(desktop ? typography.labelMd : typography.body), color: colors.textPrimary, marginBottom: spacing.xs }}>Password</Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                        backgroundColor: colors.inputBackground,
                        paddingHorizontal: spacing.md,
                    }}
                >
                    <MaterialIcons name="lock-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            flex: 1,
                            paddingVertical: spacing.sm,
                            color: colors.textPrimary,
                            fontSize: 14,
                        }}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={{ paddingVertical: spacing.sm, paddingLeft: spacing.sm }}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name={showPassword ? 'visibility-off' : 'visibility'}
                            size={18}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: spacing.lg }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{
                    backgroundColor: colors.cta,
                    paddingVertical: spacing.md,
                    borderRadius: radii.lg,
                    alignItems: 'center',
                    opacity: loading ? 0.7 : 1,
                }}
                activeOpacity={0.8}
            >
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </Text>
            </TouchableOpacity>

            <View style={{ marginTop: spacing.md, gap: spacing.sm } as any}>
                <TouchableOpacity
                    onPress={() => handleRegisterPortfolio('venues')}
                    style={{
                        paddingVertical: spacing.md,
                        borderRadius: radii.lg,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                        backgroundColor: colors.surface,
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                        Register your venue
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleRegisterPortfolio('vendors')}
                    style={{
                        paddingVertical: spacing.md,
                        borderRadius: radii.lg,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                        backgroundColor: colors.surface,
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                        Register your vendor/service business
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Attendee conversion CTAs */}
            <View style={{ marginTop: spacing.md, gap: spacing.sm } as any}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('SubscriptionPlans')}
                    style={{
                        paddingVertical: spacing.md,
                        borderRadius: radii.lg,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
                        backgroundColor: colors.surface,
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                        View Plans / Become a Vendor
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleRegisterPortfolio('vendors')}
                    style={{
                        paddingVertical: spacing.md,
                        borderRadius: radii.lg,
                        alignItems: 'center',
                        backgroundColor: colors.muted,
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                        Start Vendor Application
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View style={{ marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.muted, borderRadius: radii.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                    Login to access your subscriber profile, create portfolios, and manage your business listings.
                </Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            {isDesktop ? (
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingVertical: spacing.xxl,
                        paddingHorizontal: 48,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
                        {renderCard(true)}
                    </View>
                </ScrollView>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingHorizontal: spacing.lg,
                            paddingTop: spacing.sm,
                            paddingBottom: spacing.xl,
                        }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
                        >
                            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                                Back to My Account
                            </Text>
                        </TouchableOpacity>

                        {renderCard(false)}
                    </ScrollView>
                </>
            )}

            {alertState && (
                <ThemedAlert
                    visible={alertState.visible}
                    title={alertState.title}
                    message={alertState.message}
                    buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
                    onDismiss={() => setAlertState(null)}
                />
            )}
        </View>
    );
}
