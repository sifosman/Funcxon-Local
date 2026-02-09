import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

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
            Alert.alert('Error', err?.message ?? 'Failed to add event.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Delete Event', 'Are you sure you want to remove this event?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setEvents((prev) => prev.filter((e) => e.id !== id));
                    await supabase.from('tasks').delete().eq('id', id);
                },
            },
        ]);
    };

    const groupedEvents = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        const month = event.event_date
            ? new Date(event.event_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                {/* Header */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                                Calendar Updates
                            </Text>
                            <Text style={{ ...typography.body, color: colors.textMuted }}>
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
                </View>

                {/* Events */}
                <View style={{ paddingHorizontal: spacing.lg }}>
                    {events.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                            <MaterialIcons name="event-busy" size={48} color={colors.textMuted} />
                            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
                                No upcoming events
                            </Text>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                                Tap + to add your first event
                            </Text>
                        </View>
                    )}

                    {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                        <View key={month} style={{ marginBottom: spacing.lg }}>
                            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
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
                                            backgroundColor: colors.surface, borderRadius: radii.md,
                                            padding: spacing.md, marginBottom: spacing.sm,
                                            borderWidth: 1, borderColor: colors.borderSubtle,
                                        }}
                                    >
                                        <View style={{
                                            width: 48, height: 48, borderRadius: radii.md,
                                            backgroundColor: '#E0F2F7', alignItems: 'center', justifyContent: 'center',
                                            marginRight: spacing.md,
                                        }}>
                                            <Text style={{ ...typography.titleMedium, color: colors.primaryTeal, fontWeight: '700' }}>
                                                {dayNum}
                                            </Text>
                                            <Text style={{ ...typography.caption, color: colors.primaryTeal, fontSize: 10 }}>
                                                {dayName}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '500' }}>
                                                {event.title}
                                            </Text>
                                            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
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
            </ScrollView>

            {/* Add Event Modal */}
            <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
                    <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, width: '100%', maxWidth: 400 }}>
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
                                borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                backgroundColor: colors.surfaceMuted, color: colors.textPrimary, marginBottom: spacing.md,
                            }}
                        />

                        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{
                                borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                backgroundColor: colors.surfaceMuted, marginBottom: spacing.md,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <Text style={{ color: colors.textPrimary }}>{addForm.date}</Text>
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
                                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center' }}
                            >
                                <Text style={{ ...typography.body, color: colors.textPrimary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddEvent}
                                disabled={saving}
                                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
                            >
                                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
                                    {saving ? 'Adding...' : 'Add Event'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
