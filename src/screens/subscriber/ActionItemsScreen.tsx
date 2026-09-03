import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
    const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

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
            setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to add item.' });
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

    const isDesktop = useIsDesktop();
    const pendingCount = items.filter((i) => i.status !== 'completed').length;
    const completedCount = items.filter((i) => i.status === 'completed').length;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const desktopContainerStyle = {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center' as const,
        paddingHorizontal: 48,
    };

    const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
    const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

    const renderHeader = (isDesktopHeader: boolean) => (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
                Tasks
            </Text>
            <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Action Items
            </Text>
            <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
                Manage your pending tasks and to-dos
            </Text>
        </View>
    );

    const renderSummaryCards = () => (
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg } as any}>
            <View style={{
                flex: 1, backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.md,
                borderWidth: 1, borderColor: cardBorder, alignItems: 'center',
            }}>
                <Text style={{ ...typography.headlineMd, color: '#F59E0B' }}>{pendingCount}</Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>Pending</Text>
            </View>
            <View style={{
                flex: 1, backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.md,
                borderWidth: 1, borderColor: cardBorder, alignItems: 'center',
            }}>
                <Text style={{ ...typography.headlineMd, color: '#16A34A' }}>{completedCount}</Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>Completed</Text>
            </View>
        </View>
    );

    const renderAddItem = () => (
        <View style={{ marginBottom: spacing.lg }}>
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: cardSurface, borderRadius: radii.md,
                borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
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
    );

    const renderItemRow = (item: ActionItem) => {
        const completed = item.status === 'completed';
        const due = item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
        return (
            <View
                key={item.id}
                style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: cardSurface, borderRadius: radii.md,
                    padding: isDesktop ? spacing.md : spacing.md, marginBottom: spacing.sm,
                    borderWidth: 1, borderColor: cardBorder,
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
                        ...typography.bodyMd, color: colors.textPrimary,
                        textDecorationLine: completed ? 'line-through' : 'none',
                        opacity: completed ? 0.6 : 1,
                    } as any}>
                        {item.title}
                    </Text>
                    {due && (
                        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                            Due: {due}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <MaterialIcons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
                {isDesktop ? (
                    <>
                        {renderHeader(true)}
                        <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
                            <View style={{ flex: 2 } as any}>
                                {renderAddItem()}
                                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                                    <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
                                        Action Items
                                    </Text>
                                    {items.length === 0 && (
                                        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                                            <MaterialIcons name="checklist" size={48} color={colors.textMuted} />
                                            <Text style={{ ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md } as any}>
                                                No action items yet
                                            </Text>
                                        </View>
                                    )}
                                    {items.map(renderItemRow)}
                                </View>
                            </View>
                            <View style={{ flex: 1 } as any}>
                                {renderSummaryCards()}
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

                        {/* Summary */}
                        <View style={{ paddingHorizontal: spacing.lg }}>
                            {renderSummaryCards()}
                        </View>

                        {/* Add New Item */}
                        <View style={{ paddingHorizontal: spacing.lg }}>
                            {renderAddItem()}
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

                            {items.map(renderItemRow)}
                        </View>
                    </>
                )}
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
        </View>
    );
}
