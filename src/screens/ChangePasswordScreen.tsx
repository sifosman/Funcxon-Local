import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { colors, spacing, radii, typography } from '../theme';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing details', 'Please complete all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure the new password fields match.');
      return;
    }

    const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionResult.session?.user?.email) {
      Alert.alert('Session expired', 'Please sign in again before changing your password.');
      return;
    }

    setSaving(true);

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: sessionResult.session.user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setSaving(false);
      Alert.alert('Current password incorrect', reauthError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateError) {
      Alert.alert('Password update failed', updateError.message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password updated', 'Your password has been changed successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }} keyboardShouldPersistTaps="handled">
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
              backgroundColor: colors.primaryTeal,
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              alignItems: 'center',
              opacity: saving ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ ...typography.body, fontWeight: '600', color: '#FFFFFF' }}>{saving ? 'Saving...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
