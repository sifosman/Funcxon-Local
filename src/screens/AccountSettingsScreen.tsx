import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useAuth } from '../auth/AuthContext';
import { colors, radii, spacing, typography } from '../theme';
import { PrimaryButton } from '../components/ui';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AccountSettings'>;

type UserProfileRow = {
  username: string | null;
  full_name: string | null;
  email: string | null;
};

export default function AccountSettingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileRowExists, setProfileRowExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('username, full_name, email')
        .eq('auth_user_id', user.id)
        .maybeSingle<UserProfileRow>();

      if (error) {
        setLoading(false);
        setAlertState({ visible: true, title: 'Unable to load profile', message: error.message });
        return;
      }

      const fallbackName = typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : '';
      const fallbackUsername = typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username
        : '';

      setProfileRowExists(!!data);
      setUsername(data?.username ?? fallbackUsername);
      setFullName(data?.full_name ?? fallbackName);
      setEmail(data?.email ?? user.email ?? '');
      setLoading(false);
    };

    loadProfile();
  }, [navigation, user]);

  const handleSave = async () => {
    if (!user?.id) {
      setAlertState({ visible: true, title: 'Sign in required', message: 'Please sign in to update your account.' });
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedUsername) {
      setAlertState({ visible: true, title: 'Username required', message: 'Please enter a username.' });
      return;
    }

    setSaving(true);

    const payload = {
      username: trimmedUsername,
      full_name: trimmedFullName || null,
      email: user.email ?? email,
    };

    if (profileRowExists) {
      const { error: profileError } = await supabase
        .from('users')
        .update(payload)
        .eq('auth_user_id', user.id);

      if (profileError) {
        setSaving(false);
        setAlertState({ visible: true, title: 'Unable to save profile', message: profileError.message });
        return;
      }
    }

    const metadataUpdates: Record<string, string> = {
      username: trimmedUsername,
    };

    if (trimmedFullName) {
      metadataUpdates.name = trimmedFullName;
      metadataUpdates.full_name = trimmedFullName;
    } else {
      metadataUpdates.name = '';
      metadataUpdates.full_name = '';
    }

    const { error: authError } = await supabase.auth.updateUser({ data: metadataUpdates });
    setSaving(false);

    if (authError) {
      setAlertState({ visible: true, title: 'Profile saved with warnings', message: 'Your profile details were saved, but your auth profile could not be fully updated.' });
      return;
    }

    if (!profileRowExists) {
      setAlertState({ visible: true, title: 'Profile updated', message: 'Your account details have been saved. Some app profile fields will sync fully once your user profile row is created.' });
      return;
    }

    setAlertState({ visible: true, title: 'Profile updated', message: 'Your account details have been saved.' });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
            Back
          </Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.lg,
          }}
        >
          <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Account Settings
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
            Update your name, username and password from one place.
          </Text>

          <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading && !saving}
            placeholder="Enter username"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          />

          <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            editable={!loading && !saving}
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          />

          <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Email</Text>
          <TextInput
            value={email}
            editable={false}
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              color: colors.textMuted,
              marginBottom: spacing.lg,
              backgroundColor: colors.backgroundAlt,
            }}
          />

          <PrimaryButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading || saving} />

          <TouchableOpacity
            onPress={() => navigation.navigate('ChangePassword')}
            style={{
              marginTop: spacing.md,
              borderRadius: radii.md,
              paddingVertical: spacing.md,
              alignItems: 'center',
              backgroundColor: colors.primary,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
