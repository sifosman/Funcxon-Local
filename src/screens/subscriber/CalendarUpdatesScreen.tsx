import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
    SubscriberProfile: undefined;
    CalendarUpdates: undefined;
};

type CalendarEvent = {
    id: number;
    title: string;
    event_date: string;
    event_time: string | null;
    notes: string | null;
};

export default function CalendarUpdatesScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [internalUserId, setInternalUserId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [addForm, setAddForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

    const loadEvents = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            if (!userData) {
                setLoading(false);
                return;
            }
            setInternalUserId(userData.id);

            // Use tasks table with a convention: tasks with due_date serve as calendar events
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('id, title, due_date, status, created_at')
                .eq('user_id', userData.id)
                .not('due_date', 'is', null)
                .order('due_date', { ascending: true })
                .limit(50);

            if (error) throw error;

            setEvents(
                (tasks || []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    event_date: t.due_date ? t.due_date.split('T')[0] : '',
                    event_time: null,
                    notes: null,
                }))
            );
        } catch (err) {
            console.error('Failed to load calendar events:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleAddEvent = async () => {
        if (!addForm.title.trim() || !internalUserId) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('tasks').insert({
                user_id: internalUserId,
                title: addForm.title.trim(),
                status: 'pending',
                due_date: new Date(addForm.date).toISOString(),
            });
            if (error) throw error;
            setShowAddModal(false);
            setAddForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' });
            await loadEvents();
        } catch (err: any) {
            setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to add event.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setAlertState({
            visible: true,
            title: 'Delete Event',
            message: 'Are you sure you want to remove this event?',
            buttons: [
                { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setAlertState(null);
                        setEvents((prev) => prev.filter((e) => e.id !== id));
                        await supabase.from('tasks').delete().eq('id', id);
                    },
                },
            ],
        });
    };

    const groupedEvents = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        const month = event.event_date
            ? new Date(event.event_date).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
            : 'No Date';
        if (!acc[month]) acc[month] = [];
        acc[month].push(event);
        return acc;
    }, {});

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const isDesktop = useIsDesktop();
    const desktopContainerStyle = {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center' as const,
        paddingHorizontal: 48,
    };
    const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
    const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

    const renderHeader = (isDesktopHeader: boolean) => (
        <View style={{ marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
                <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
                    Calendar
                </Text>
                <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary, marginBottom: spacing.xs } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                    Calendar Updates
                </Text>
                <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
                    Your upcoming events and schedule
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                }}
            >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    const renderEvents = () => (
        <View>
            {events.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                    <MaterialIcons name="event-busy" size={48} color={colors.textMuted} />
                    <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md } as any : { ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
                        No upcoming events
                    </Text>
                    <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs } as any : { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                        Tap + to add your first event
                    </Text>
                </View>
            )}

            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <View key={month} style={{ marginBottom: spacing.lg }}>
                    <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                        {month}
                    </Text>
                    {monthEvents.map((event) => {
                        const dateObj = new Date(event.event_date);
                        const dayNum = dateObj.getDate();
                        const dayName = dateObj.toLocaleDateString('en-ZA', { weekday: 'short' });
                        return (
                            <View
                                key={event.id}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: cardSurface, borderRadius: radii.md,
                                    padding: spacing.md, marginBottom: spacing.sm,
                                    borderWidth: 1, borderColor: cardBorder,
                                }}
                            >
                                <View style={{
                                    width: 48, height: 48, borderRadius: radii.md,
                                    backgroundColor: '#f2f7ff', alignItems: 'center', justifyContent: 'center',
                                    marginRight: spacing.md,
                                }}>
                                    <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>
                                        {dayNum}
                                    </Text>
                                    <Text style={{ ...typography.caption, color: colors.textPrimary, fontSize: 10 }}>
                                        {dayName}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodyMedium, color: colors.textPrimary }}>
                                        {event.title}
                                    </Text>
                                    <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                        {dateObj.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(event.id)}>
                                    <MaterialIcons name="delete-outline" size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
                {isDesktop ? (
                    <>
                        {renderHeader(true)}
                        <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
                            <View style={{ flex: 2 } as any}>
                                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                                    {renderEvents()}
                                </View>
                            </View>
                            <View style={{ flex: 1 } as any}>
                                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                                    <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm }}>
                                        Upcoming
                                    </Text>
                                    <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
                                        {events.length} event{events.length === 1 ? '' : 's'} scheduled
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Header */}
                        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
                            >
                                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                            </TouchableOpacity>

                            {renderHeader(false)}
                        </View>

                        {/* Events */}
                        <View style={{ paddingHorizontal: spacing.lg }}>
                            {renderEvents()}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Add Event Modal */}
            <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
                    <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, width: '100%', maxWidth: 400, borderWidth: isDesktop ? 1 : 0, borderColor: cardBorder }}>
                        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                            Add Calendar Event
                        </Text>

                        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Event Title</Text>
                        <TextInput
                            value={addForm.title}
                            onChangeText={(v) => setAddForm((p) => ({ ...p, title: v }))}
                            placeholder="e.g. Client meeting"
                            placeholderTextColor={colors.textMuted}
                            style={{
                                borderWidth: 1, borderColor: cardBorder, borderRadius: radii.md,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                backgroundColor: colors.surfaceMuted, color: colors.textPrimary, marginBottom: spacing.md,
                            }}
                        />

                        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{
                                borderWidth: 1, borderColor: cardBorder, borderRadius: radii.md,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                backgroundColor: colors.surfaceMuted, marginBottom: spacing.md,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <Text style={{ ...typography.body, color: colors.textPrimary }}>{addForm.date}</Text>
                            <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date(addForm.date)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                onChange={(_e: any, selectedDate?: Date) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) {
                                        setAddForm((p) => ({ ...p, date: selectedDate.toISOString().split('T')[0] }));
                                    }
                                }}
                            />
                        )}

                        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                            <TouchableOpacity
                                onPress={() => setShowAddModal(false)}
                                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: cardBorder, alignItems: 'center' }}
                            >
                                <Text style={{ ...typography.body, color: colors.textPrimary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddEvent}
                                disabled={saving}
                                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
                            >
                                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
                                    {saving ? 'Adding...' : 'Add Event'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
