import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

type ProfileStackParamList = {
    SubscriberProfile: undefined;
    ActionItems: undefined;
};

type ActionItem = {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
};

export default function ActionItemsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ActionItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [adding, setAdding] = useState(false);
    const [internalUserId, setInternalUserId] = useState<number | null>(null);

    const loadItems = useCallback(async () => {
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

            // Load tasks that serve as action items for the vendor
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('id, title, status, due_date, created_at')
                .eq('user_id', userData.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setItems(
                (tasks || []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status || 'pending',
                    priority: 'normal',
                    due_date: t.due_date,
                    created_at: t.created_at,
                }))
            );
        } catch (err) {
            console.error('Failed to load action items:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleAdd = async () => {
        const trimmed = newItem.trim();
        if (!trimmed || !internalUserId) return;
        setAdding(true);
        try {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            const { error } = await supabase.from('tasks').insert({
                user_id: internalUserId,
                title: trimmed,
                status: 'pending',
                due_date: dueDate.toISOString(),
            });
            if (error) throw error;
            setNewItem('');
            await loadItems();
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to add item.');
        } finally {
            setAdding(false);
        }
    };

    const handleToggle = async (item: ActionItem) => {
        const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
        // Optimistic update
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: nextStatus } : i));
        await supabase.from('tasks').update({ status: nextStatus }).eq('id', item.id);
    };

    const handleDelete = async (id: number) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        await supabase.from('tasks').delete().eq('id', id);
    };

    const pendingCount = items.filter((i) => i.status !== 'completed').length;
    const completedCount = items.filter((i) => i.status === 'completed').length;

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

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Action Items
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        Manage your pending tasks and to-dos
                    </Text>
                </View>

                {/* Summary */}
                <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.lg, gap: spacing.md }}>
                    <View style={{
                        flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md,
                        borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center',
                    }}>
                        <Text style={{ ...typography.displayLarge, color: '#F59E0B', fontWeight: '700' }}>{pendingCount}</Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Pending</Text>
                    </View>
                    <View style={{
                        flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md,
                        borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center',
                    }}>
                        <Text style={{ ...typography.displayLarge, color: '#16A34A', fontWeight: '700' }}>{completedCount}</Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Completed</Text>
                    </View>
                </View>

                {/* Add New Item */}
                <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: colors.surface, borderRadius: radii.md,
                        borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden',
                    }}>
                        <TextInput
                            value={newItem}
                            onChangeText={setNewItem}
                            placeholder="Add a new action item..."
                            placeholderTextColor={colors.textMuted}
                            style={{
                                flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                color: colors.textPrimary,
                            }}
                            onSubmitEditing={handleAdd}
                        />
                        <TouchableOpacity
                            onPress={handleAdd}
                            disabled={adding || !newItem.trim()}
                            style={{
                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                backgroundColor: colors.primary,
                            }}
                        >
                            <MaterialIcons name="add" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Items List */}
                <View style={{ paddingHorizontal: spacing.lg }}>
                    {items.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                            <MaterialIcons name="checklist" size={48} color={colors.textMuted} />
                            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
                                No action items yet
                            </Text>
                        </View>
                    )}

                    {items.map((item) => {
                        const completed = item.status === 'completed';
                        const due = item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA') : null;
                        return (
                            <View
                                key={item.id}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: colors.surface, borderRadius: radii.md,
                                    padding: spacing.md, marginBottom: spacing.sm,
                                    borderWidth: 1, borderColor: colors.borderSubtle,
                                }}
                            >
                                <TouchableOpacity onPress={() => handleToggle(item)} style={{ marginRight: spacing.sm }}>
                                    <MaterialIcons
                                        name={completed ? 'check-circle' : 'radio-button-unchecked'}
                                        size={22}
                                        color={completed ? '#16A34A' : colors.textMuted}
                                    />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        ...typography.body, color: colors.textPrimary,
                                        textDecorationLine: completed ? 'line-through' : 'none',
                                        opacity: completed ? 0.6 : 1,
                                    }}>
                                        {item.title}
                                    </Text>
                                    {due && (
                                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                            Due: {due}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                    <MaterialIcons name="close" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
