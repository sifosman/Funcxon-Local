import { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { colors, spacing, radii, typography } from '../theme';
import ThemedAlert from '../components/ThemedAlert';

export default function MarketingPermissionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [marketingOptWhatsapp, setMarketingOptWhatsapp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const loadPreference = useCallback(async () => {
    const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionResult.session?.user?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('marketing_opt_in, marketing_opt_whatsapp')
      .eq('auth_user_id', sessionResult.session.user.id)
      .maybeSingle();

    if (!error && data) {
      setMarketingOptIn(!!data.marketing_opt_in);
      setMarketingOptWhatsapp(!!data.marketing_opt_whatsapp);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreference();
    }, [loadPreference]),
  );

  const handleSave = async () => {
    const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionResult.session?.user?.id) {
      setAlertState({ visible: true, title: 'Session expired', message: 'Please sign in again before updating your preferences.' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ marketing_opt_in: marketingOptIn, marketing_opt_whatsapp: marketingOptWhatsapp })
      .eq('auth_user_id', sessionResult.session.user.id);
    setSaving(false);

    if (error) {
      setAlertState({ visible: true, title: 'Update failed', message: error.message });
      return;
    }

    setAlertState({ visible: true, title: 'Preferences updated', message: 'Your marketing permissions have been saved.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }}>
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
          <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>Marketing Permissions</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.xl }}>
            Choose whether you want to receive promotional emails, product updates, and marketing communications.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>Email marketing</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                Receive occasional news, feature updates, offers, and relevant product communications.
              </Text>
            </View>
            <Switch
              value={marketingOptIn}
              onValueChange={setMarketingOptIn}
              trackColor={{ false: colors.borderSubtle, true: colors.textPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>WhatsApp marketing</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                Receive occasional updates, offers, and relevant product communications via WhatsApp.
              </Text>
            </View>
            <Switch
              value={marketingOptWhatsapp}
              onValueChange={setMarketingOptWhatsapp}
              trackColor={{ false: colors.borderSubtle, true: colors.textPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || saving}
            style={{
              marginTop: spacing.xl,
              backgroundColor: colors.textPrimary,
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              alignItems: 'center',
              opacity: loading || saving ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Save Preferences'}
            </Text>
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
