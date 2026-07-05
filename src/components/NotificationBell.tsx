import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, NotificationRow } from '../lib/notifications';

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
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
        fetchNotifications(userId, 20, true),
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
  }, [open]);

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsRead(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] mark all read failed:', err);
    }
  };

  const navigateFromLink = (link: string | null) => {
    if (!link) return;
    const parent = navigation.getParent() as any;

    if (link.startsWith('/quotes/')) {
      const id = link.replace('/quotes/', '');
      parent?.navigate?.('Quotes', { screen: 'QuoteDetail', params: { quoteId: id } });
      return;
    }

    if (link.startsWith('/bookings/')) {
      const id = link.replace('/bookings/', '');
      navigation.navigate('BookingDetail', { bookingId: Number(id) });
      return;
    }

    if (link === '/my-tours') {
      navigation.navigate('MyTours');
      return;
    }

    if (link === '/venue/tours') {
      parent?.navigate?.('Account', { screen: 'VenueTourBookings' });
      return;
    }

    if (link === '/venue/quote-requests' || link.startsWith('/venue/quote-requests/')) {
      parent?.navigate?.('Account', { screen: 'VenueQuoteRequests' });
      return;
    }

    if (link.startsWith('/vendor/quotes/')) {
      const id = link.replace('/vendor/quotes/', '');
      parent?.navigate?.('Account', { screen: 'VendorQuoteCreate', params: { quoteRequestId: Number(id) } });
      return;
    }
  };

  const handleItemPress = async (n: NotificationRow) => {
    setOpen(false);
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    navigateFromLink(n.link);
  };

  const formatTime = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={{ ...typography.bodySemiBold, color: colors.primary }}>Mark all read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <MaterialIcons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
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
                notifications
                  .filter((n) => !n.read)
                  .map((n) => (
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
              onPress={() => setOpen(false)}
              style={{
                margin: spacing.lg,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
