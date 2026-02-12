import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

// Dev mode - accepts any credentials
const DEV_MODE = __DEV__;

export default function SubscriberLoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing details', 'Please enter both email and password.');
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
            Alert.alert('Invalid email', 'Please enter a valid email address.');
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.xl,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}
                >
                    <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                    <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                        Back to My Account
                    </Text>
                </TouchableOpacity>

                {/* Card container */}
                <View
                    style={{
                        maxWidth: 400,
                        alignSelf: 'center',
                        width: '100%',
                        backgroundColor: colors.surface,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                        padding: spacing.xl,
                    }}
                >
                    {/* Header */}
                    <View style={{ marginBottom: spacing.xl }}>
                        <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>
                            Subscriber Portal
                        </Text>
                        <Text style={{ ...typography.body, color: colors.textMuted }}>
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
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>Email</Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: radii.lg,
                                borderWidth: 1,
                                borderColor: colors.borderSubtle,
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
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>Password</Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: radii.lg,
                                borderWidth: 1,
                                borderColor: colors.borderSubtle,
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
                        <Text style={{ ...typography.caption, color: colors.primaryTeal }}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        style={{
                            backgroundColor: colors.primaryTeal,
                            paddingVertical: spacing.md,
                            borderRadius: radii.lg,
                            alignItems: 'center',
                            opacity: loading ? 0.7 : 1,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ ...typography.body, fontWeight: '600', color: '#FFFFFF' }}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>

                    {/* Attendee conversion CTAs */}
                    <View style={{ marginTop: spacing.md }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('SubscriptionPlans')}
                            style={{
                                paddingVertical: spacing.md,
                                borderRadius: radii.lg,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: colors.borderSubtle,
                                backgroundColor: colors.surface,
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary }}>
                                View Plans / Become a Vendor
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('ApplicationStep1')}
                            style={{
                                marginTop: spacing.sm,
                                paddingVertical: spacing.md,
                                borderRadius: radii.lg,
                                alignItems: 'center',
                                backgroundColor: colors.muted,
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary }}>
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
            </ScrollView>
        </View>
    );
}
