import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, NotificationRow } from '../lib/notifications';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

const POLL_INTERVAL_MS = 30_000;

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

export default function NotificationBell() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = user?.id;

  const load = async (showLoading = false) => {
    if (!userId) return;
    if (showLoading) setLoading(true);
    try {
      const [rows, count] = await Promise.all([
        fetchNotifications(userId, 20),
        fetchUnreadCount(userId),
      ]);
      setNotifications(rows);
      setUnreadCount(count);
    } catch (err) {
      console.error('[NotificationBell] load failed:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    load(true);
    const interval = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    load(false);
    if (userId) {
      markAllNotificationsRead(userId).catch(() => {});
      setUnreadCount(0);
    }
  }, [open]);

  const handleItemPress = async (n: NotificationRow) => {
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    if (n.link?.startsWith('/bookings/')) {
      const id = n.link.replace('/bookings/', '');
      navigation.navigate('BookingDetail', { bookingId: Number(id) });
    } else if (n.link === '/my-tours') {
      navigation.navigate('MyTours');
    } else if (n.link === '/venue/tours') {
      // lister notification - best-effort navigate via parent tab
      const parent = navigation.getParent() as any;
      parent?.navigate?.('Account', { screen: 'VenueTourBookings' });
    }
  };

  const formatTime = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!userId) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ position: 'relative', padding: spacing.sm }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="notifications" size={24} color={colors.primary} />
        {unreadCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 18,
              height: 18,
              borderRadius: radii.full,
              backgroundColor: colors.destructive,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '80%',
              paddingBottom: spacing.xl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Notifications</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {loading && notifications.length === 0 ? (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : notifications.length === 0 ? (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <MaterialIcons name="notifications-none" size={48} color={colors.textMuted} />
                  <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
                    No notifications yet.
                  </Text>
                </View>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => handleItemPress(n)}
                    style={{
                      padding: spacing.lg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderSubtle,
                      backgroundColor: n.read ? colors.surface : colors.primaryMuted,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                      {!n.read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: radii.full,
                            backgroundColor: colors.primary,
                            marginTop: 6,
                          }}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                          {n.title}
                        </Text>
                        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                          {n.body}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                          {formatTime(n.created_at)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => { setOpen(false); navigation.navigate('MyTours'); }}
              style={{
                margin: spacing.lg,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View My Tours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
