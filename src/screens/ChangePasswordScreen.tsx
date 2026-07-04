import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { colors, spacing, radii, typography } from '../theme';
import ThemedAlert from '../components/ThemedAlert';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please complete all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setAlertState({ visible: true, title: 'Weak password', message: 'Your new password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertState({ visible: true, title: 'Passwords do not match', message: 'Please make sure the new password fields match.' });
      return;
    }

    const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionResult.session?.user?.email) {
      setAlertState({ visible: true, title: 'Session expired', message: 'Please sign in again before changing your password.' });
      return;
    }

    setSaving(true);

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: sessionResult.session.user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setSaving(false);
      setAlertState({ visible: true, title: 'Current password incorrect', message: reauthError.message });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateError) {
      setAlertState({ visible: true, title: 'Password update failed', message: updateError.message });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAlertState({ visible: true, title: 'Password updated', message: 'Your password has been changed successfully.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    visible: boolean,
    onToggleVisible: () => void,
    placeholder: string,
  ) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>{label}</Text>
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
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            color: colors.textPrimary,
            fontSize: 14,
          }}
        />
        <TouchableOpacity onPress={onToggleVisible} style={{ paddingVertical: spacing.sm, paddingLeft: spacing.sm }} activeOpacity={0.7}>
          <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back to My Account</Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.xl,
          }}
        >
          <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>Change Password</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.xl }}>
            Enter your current password and choose a new secure password for your account.
          </Text>

          {renderPasswordField('Current Password', currentPassword, setCurrentPassword, showCurrentPassword, () => setShowCurrentPassword((prev) => !prev), 'Current password')}
          {renderPasswordField('New Password', newPassword, setNewPassword, showNewPassword, () => setShowNewPassword((prev) => !prev), 'New password')}
          {renderPasswordField('Confirm New Password', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword((prev) => !prev), 'Confirm new password')}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.textPrimary,
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              alignItems: 'center',
              opacity: saving ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>{saving ? 'Saving...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
