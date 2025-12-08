import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';

export default function ProfileScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, position: 'relative' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xxl }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>U</Text>
          </View>
          <View style={{ marginLeft: spacing.md }}>
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
              }}
            >
              Your profile
            </Text>
            <Text
              style={{
                ...typography.caption,
                color: colors.textMuted,
                marginTop: spacing.xs,
              }}
            >
              Manage your account and event preferences.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.9}
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: colors.primaryTeal,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...typography.body,
              color: '#FFFFFF',
              marginRight: spacing.xs,
            }}
          >
            Open quick actions
          </Text>
          <MaterialIcons name={menuOpen ? 'expand-less' : 'expand-more'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              ...typography.titleMedium,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Account
          </Text>
          <Text
            style={{
              ...typography.body,
              color: colors.textMuted,
            }}
          >
            Additional account details and settings can go here.
          </Text>
        </View>
      </ScrollView>

      {menuOpen && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 80,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radii.xl,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            {[
              { label: 'Quotes', icon: 'request-quote' as const },
              { label: 'My events', icon: 'event' as const },
              { label: 'Settings', icon: 'settings' as const },
              { label: 'Sign out', icon: 'logout' as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={{
                  alignItems: 'center',
                  marginHorizontal: spacing.sm,
                }}
                activeOpacity={0.8}
                onPress={async () => {
                  if (item.label === 'Sign out') {
                    const { error } = await signOut();
                    if (error) {
                      Alert.alert('Sign out failed', error.message);
                    }
                    setMenuOpen(false);
                  }
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.xs,
                  }}
                >
                  <MaterialIcons name={item.icon} size={26} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textPrimary,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
