import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';

const fallbackEventTypes = [
  'Wedding',
  'Engagement party',
  'Birthday party',
  'Corporate event',
  'Baby shower',
  'Bridal shower',
  'Anniversary',
  'Graduation',
  'Funeral',
  'Product launch',
  'Year-end function',
  'Conference',
  'Other',
];

type Task = {
  id: number;
  title: string;
  status: string | null;
  due_date: string | null;
};

type PlannerData = {
  tasks: Task[];
  userId: number | null;
};

type CalendarItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  tag: string;
  tagColor: string;
};

const tagOptions = [
  { label: 'Meeting', value: 'meeting', color: '#3B82F6' },
  { label: 'Appointment', value: 'appointment', color: '#22C55E' },
  { label: 'Reminder', value: 'reminder', color: '#F59E0B' },
  { label: 'Task', value: 'task', color: '#8B5CF6' },
];

type BudgetItem = {
  name: string;
  spent: number;
  total: number;
};

export default function PlannerScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [eventDetails, setEventDetails] = useState({
    name: '',
    theme: '',
    type: '',
    otherType: '',
    date: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarDatePicker, setShowCalendarDatePicker] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { name: 'Venue', spent: 0, total: 0 },
    { name: 'Catering', spent: 0, total: 0 },
    { name: 'Photography', spent: 0, total: 0 },
    { name: 'Flowers', spent: 0, total: 0 },
  ]);
  const [editingBudgetIdx, setEditingBudgetIdx] = useState<number | null>(null);
  const [editBudgetForm, setEditBudgetForm] = useState({ name: '', spent: '', total: '' });
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([
    {
      id: 1,
      title: 'Venue Visit',
      date: '2024-02-15',
      time: '2:00 PM',
      tag: 'meeting',
      tagColor: '#3B82F6',
    },
    {
      id: 2,
      title: 'Catering Tasting',
      date: '2024-02-18',
      time: '12:00 PM',
      tag: 'appointment',
      tagColor: '#22C55E',
    },
    {
      id: 3,
      title: 'Final Dress Fitting',
      date: '2024-02-25',
      time: '10:00 AM',
      tag: 'appointment',
      tagColor: '#22C55E',
    },
  ]);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    time: '',
    tag: 'meeting',
    tagColor: '#3B82F6',
  });
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);

  const { data: eventTypeOptions } = useQuery<string[]>({
    queryKey: ['event-type-options'],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from('dropdown_options')
        .select('value')
        .eq('category', 'event_type')
        .order('sort_order', { ascending: true });
      if (rows && rows.length > 0) {
        return rows.map((r: any) => r.value as string);
      }
      return fallbackEventTypes;
    },
    staleTime: 1000 * 60 * 5,
  });

  const eventTypes = eventTypeOptions ?? fallbackEventTypes;

  const { data, isLoading, error, refetch } = useQuery<PlannerData>({
    queryKey: ['planner-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { tasks: [], userId: null };
      }

      const { data: userRows, error: userError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      let internalUser = userRows ?? null;

      if (!internalUser) {
        const email = user.email ?? 'attendee@funxon.com';
        const username = email.split('@')[0] || 'attendee';
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            username,
            password: 'demo',
            email,
            full_name: username,
          })
          .select('id, username, email')
          .single();

        if (!createError && createdUser) {
          internalUser = createdUser;
        }
      }

      if (!internalUser) {
        return { tasks: [], userId: null };
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('user_id', internalUser.id)
        .order('due_date', { ascending: true })
        .limit(50);

      if (tasksError) {
        throw tasksError;
      }

      if (!tasks || tasks.length === 0) {
        const seedTasks = [
          { title: 'Book venue', due_date: '2024-02-15', status: 'pending' },
          { title: 'Send invitations', due_date: '2024-02-10', status: 'completed' },
          { title: 'Order flowers', due_date: '2024-02-20', status: 'pending' },
        ].map((task) => ({
          ...task,
          user_id: internalUser.id,
        }));

        await supabase.from('tasks').insert(seedTasks);

        const { data: seededTasks } = await supabase
          .from('tasks')
          .select('id, title, status, due_date')
          .eq('user_id', internalUser.id)
          .order('due_date', { ascending: true })
          .limit(50);

        return { tasks: (seededTasks as Task[]) ?? [], userId: internalUser.id };
      }

      return { tasks: (tasks as Task[]) ?? [], userId: internalUser.id };
    },
  });

  const tasks = data?.tasks ?? [];
  const remainingTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed').length, [tasks]);
  const budgetTotals = useMemo(() => {
    const total = budgetItems.reduce((sum, item) => sum + item.total, 0);
    const spent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
    return { total, spent, remaining: total - spent };
  }, [budgetItems]);

  const handleAddTask = async () => {
    const trimmed = newTask.trim();
    if (!trimmed || !data?.userId) return;
    setAddingTask(true);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    // Optimistic update: add task to cache immediately
    const tempTask: Task = { id: Date.now(), title: trimmed, status: 'pending', due_date: dueDate.toISOString() };
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: [...old.tasks, tempTask] } : old
    );
    setNewTask('');
    try {
      await supabase.from('tasks').insert({
        user_id: data.userId,
        title: trimmed,
        status: 'pending',
        due_date: dueDate.toISOString(),
      });
      await refetch();
    } catch {
      // Revert optimistic update on error
      await refetch();
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!data?.userId) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t) } : old
    );
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
    await refetch();
  };

  const deleteTask = async (taskId: number) => {
    // Optimistic update
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: old.tasks.filter((t) => t.id !== taskId) } : old
    );
    await supabase.from('tasks').delete().eq('id', taskId);
    await refetch();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
  };

  const handleSaveTaskEdit = async () => {
    if (!editingTask || !editTaskTitle.trim()) return;
    const newTitle = editTaskTitle.trim();
    // Optimistic update
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => t.id === editingTask.id ? { ...t, title: newTitle } : t) } : old
    );
    setEditingTask(null);
    await supabase.from('tasks').update({ title: newTitle }).eq('id', editingTask.id);
    await refetch();
  };

  const handleEditBudget = (idx: number) => {
    const item = budgetItems[idx];
    setEditingBudgetIdx(idx);
    setEditBudgetForm({ name: item.name, spent: String(item.spent), total: String(item.total) });
  };

  const handleSaveBudget = () => {
    if (editingBudgetIdx === null) return;
    setBudgetItems((prev) =>
      prev.map((item, i) =>
        i === editingBudgetIdx
          ? { name: editBudgetForm.name || item.name, spent: parseFloat(editBudgetForm.spent) || 0, total: parseFloat(editBudgetForm.total) || 0 }
          : item
      )
    );
    setEditingBudgetIdx(null);
  };

  const handleAddBudgetItem = () => {
    setBudgetItems((prev) => [...prev, { name: 'New Item', spent: 0, total: 0 }]);
    const newIdx = budgetItems.length;
    setEditingBudgetIdx(newIdx);
    setEditBudgetForm({ name: 'New Item', spent: '0', total: '0' });
  };

  const handleDeleteBudgetItem = (idx: number) => {
    setBudgetItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingBudgetIdx === idx) setEditingBudgetIdx(null);
  };

  const handleAddCalendarItem = () => {
    const nextId = Math.max(...calendarItems.map((item) => item.id), 0) + 1;
    const newItem: CalendarItem = {
      id: nextId,
      title: 'New Event',
      date: new Date().toISOString().slice(0, 10),
      time: '4:00 PM',
      tag: 'meeting',
      tagColor: '#3B82F6',
    };
    setCalendarItems((prev) => [...prev, newItem]);
    // Open edit modal immediately for the new item
    setEditingItem(newItem);
    setEditForm({
      title: newItem.title,
      date: newItem.date,
      time: newItem.time,
      tag: newItem.tag,
      tagColor: newItem.tagColor,
    });
  };

  const handleEditItem = (item: CalendarItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      date: item.date,
      time: item.time,
      tag: item.tag,
      tagColor: item.tagColor,
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setCalendarItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: editForm.title,
              date: editForm.date,
              time: editForm.time,
              tag: editForm.tag,
              tagColor: editForm.tagColor,
            }
          : item
      )
    );
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: number) => {
    setAlertState({
      visible: true,
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAlertState(null);
            setCalendarItems((prev) => prev.filter((item) => item.id !== itemId));
            if (editingItem?.id === itemId) {
              setEditingItem(null);
            }
          },
        },
      ],
    });
  };

  const handleSelectTag = (tagValue: string, tagColor: string) => {
    setEditForm((prev) => ({ ...prev, tag: tagValue, tagColor }));
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error instanceof Error) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load planner tasks.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 }}
    >
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>My Planner</Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
          Track tasks, budget, and key dates for your event.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <MaterialIcons name="event" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Event Details</Text>
        </View>
        <View style={{ gap: spacing.sm }}>
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Name</Text>
            <TextInput
              value={eventDetails.name}
              onChangeText={(value) => setEventDetails((prev) => ({ ...prev, name: value }))}
              placeholder="Enter event name"
              placeholderTextColor={colors.textMuted}
              style={{
                marginTop: spacing.xs,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />
          </View>
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Theme</Text>
            <TextInput
              value={eventDetails.theme}
              onChangeText={(value) => setEventDetails((prev) => ({ ...prev, theme: value }))}
              placeholder="Enter event theme"
              placeholderTextColor={colors.textMuted}
              style={{
                marginTop: spacing.xs,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />
          </View>
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Type</Text>
            <TouchableOpacity
              onPress={() => setShowEventTypeModal(true)}
              style={{
                marginTop: spacing.xs,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: eventDetails.type ? colors.textPrimary : colors.textMuted }}>
                {eventDetails.type === 'Other' && eventDetails.otherType ? `Other - ${eventDetails.otherType}` : (eventDetails.type || 'Select event type')}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {eventDetails.type === 'Other' && (
              <TextInput
                value={eventDetails.otherType}
                onChangeText={(value) => setEventDetails((prev) => ({ ...prev, otherType: value }))}
                placeholder="Please specify the event type"
                placeholderTextColor={colors.textMuted}
                style={{
                  marginTop: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                }}
              />
            )}
          </View>
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                marginTop: spacing.xs,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: eventDetails.date ? colors.textPrimary : colors.textMuted }}>
                {eventDetails.date || 'Select event date'}
              </Text>
              <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={eventDetails.date ? new Date(eventDetails.date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={(_event: any, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEventDetails((prev) => ({
                      ...prev,
                      date: selectedDate.toISOString().split('T')[0],
                    }));
                  }
                }}
              />
            )}
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <MaterialIcons name="checklist" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Task List</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <TextInput
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Add new task..."
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surfaceMuted,
              color: colors.textPrimary,
            }}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            style={{
              marginLeft: spacing.sm,
              padding: spacing.sm,
              borderRadius: radii.md,
              backgroundColor: colors.primary,
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 && (
          <Text style={{ ...typography.caption, color: colors.textMuted }}>No tasks yet. Add your first task.</Text>
        )}

        {tasks.map((item) => {
          const due = item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA') : 'No due date';
          const completed = item.status === 'completed';
          return (
            <View
              key={item.id}
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => toggleTask(item)} style={{ marginRight: spacing.sm }}>
                  <MaterialIcons
                    name={completed ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={completed ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...typography.body,
                      color: colors.textPrimary,
                      fontWeight: '600',
                      textDecorationLine: completed ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                    {due}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleEditTask(item)} style={{ marginRight: spacing.sm }}>
                  <MaterialIcons name="edit" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)}>
                  <MaterialIcons name="delete" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
          {remainingTasks} remaining of {tasks.length} tasks
        </Text>
      </View>

      {/* Edit Task Modal */}
      <Modal visible={editingTask !== null} transparent animationType="fade" onRequestClose={() => setEditingTask(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, width: '100%', maxWidth: 400 }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Edit Task</Text>
            <TextInput
              value={editTaskTitle}
              onChangeText={setEditTaskTitle}
              placeholder="Task title"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setEditingTask(null)}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTaskEdit}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
              >
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <MaterialIcons name="attach-money" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Budget</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          {/* Pie Chart */}
          {budgetTotals.total > 0 && (() => {
            const pieColors = ['#0F766E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
            const activeItems = budgetItems.filter(b => b.total > 0);
            let cumulative = 0;
            const total = budgetTotals.total;
            const segments = activeItems.map((item, i) => {
              const startAngle = (cumulative / total) * 360;
              cumulative += item.total;
              const endAngle = (cumulative / total) * 360;
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;
              const x1 = 50 + 45 * Math.cos(startRad);
              const y1 = 50 + 45 * Math.sin(startRad);
              const x2 = 50 + 45 * Math.cos(endRad);
              const y2 = 50 + 45 * Math.sin(endRad);
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              const color = pieColors[i % pieColors.length];
              return { path: `M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A45,45 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`, color, name: item.name, value: item.total };
            });
            const svgPaths = segments.map(s => `<path d="${s.path}" fill="${s.color}" stroke="white" stroke-width="0.5"/>`).join('');
            const legend = segments.map(s => `<div style="display:flex;align-items:center;margin-bottom:2px;"><div style="width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:4px;"></div><span style="font-size:7px;color:#444;">${s.name}</span></div>`).join('');
            const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;display:flex;align-items:center;}*{box-sizing:border-box;}</style></head><body><svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">${svgPaths}<circle cx="50" cy="50" r="26" fill="white"/><text x="50" y="48" text-anchor="middle" font-size="7" fill="#888" font-family="sans-serif">Total</text><text x="50" y="57" text-anchor="middle" font-size="8" fill="#333" font-weight="bold" font-family="sans-serif">R${(total / 1000).toFixed(0)}k</text></svg></body></html>`;
            return (
              <View style={{ width: 110, height: 110, marginRight: spacing.md }}>
                {Platform.OS === 'web' ? (
                  <div dangerouslySetInnerHTML={{ __html: html }} style={{ width: 110, height: 110 }} />
                ) : (
                  <WebView source={{ html }} style={{ width: 110, height: 110, backgroundColor: 'transparent' }} scrollEnabled={false} />
                )}
              </View>
            );
          })()}

          {/* Budget Summary */}
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>Total Budget:</Text>
            <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
              R {budgetTotals.total.toLocaleString('en-ZA')}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Total Spent:</Text>
            <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
              R {budgetTotals.spent.toLocaleString('en-ZA')}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Remaining:</Text>
            <Text style={{ ...typography.bodySemiBold, color: '#16A34A' }}>
              R {budgetTotals.remaining.toLocaleString('en-ZA')}
            </Text>
          </View>
        </View>

        {budgetItems.map((item, idx) => {
          const progress = item.total === 0 ? 0 : Math.min(item.spent / item.total, 1);
          return (
            <View
              key={`${item.name}-${idx}`}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm }}>
                    R{item.spent.toLocaleString('en-ZA')} / R{item.total.toLocaleString('en-ZA')}
                  </Text>
                  <TouchableOpacity onPress={() => handleEditBudget(idx)} style={{ marginRight: spacing.xs }}>
                    <MaterialIcons name="edit" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteBudgetItem(idx)}>
                    <MaterialIcons name="delete" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ height: 6, backgroundColor: colors.borderSubtle, borderRadius: radii.full }}>
                <View
                  style={{
                    height: 6,
                    width: `${progress * 100}%`,
                    backgroundColor: colors.primary,
                    borderRadius: radii.full,
                  }}
                />
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={handleAddBudgetItem}
          style={{
            marginTop: spacing.sm,
            alignItems: 'center',
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>+ Add Budget Item</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Budget Modal */}
      <Modal visible={editingBudgetIdx !== null} transparent animationType="fade" onRequestClose={() => setEditingBudgetIdx(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, width: '100%', maxWidth: 400 }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Edit Budget Item</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Name</Text>
            <TextInput
              value={editBudgetForm.name}
              onChangeText={(v) => setEditBudgetForm((p) => ({ ...p, name: v }))}
              placeholder="Item name"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted, color: colors.textPrimary, marginBottom: spacing.md,
              }}
            />
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Amount Spent (R)</Text>
            <TextInput
              value={editBudgetForm.spent}
              onChangeText={(v) => setEditBudgetForm((p) => ({ ...p, spent: v }))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted, color: colors.textPrimary, marginBottom: spacing.md,
              }}
            />
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Total Budget (R)</Text>
            <TextInput
              value={editBudgetForm.total}
              onChangeText={(v) => setEditBudgetForm((p) => ({ ...p, total: v }))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted, color: colors.textPrimary, marginBottom: spacing.md,
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setEditingBudgetIdx(null)}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBudget}
                style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
              >
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <MaterialIcons name="calendar-today" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Calendar Items</Text>
        </View>

        {calendarItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleEditItem(item)}
            style={{
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>{item.title}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>{item.date}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm }}>{item.time}</Text>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                  <MaterialIcons name="delete" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                marginTop: spacing.sm,
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radii.full,
                backgroundColor: `${item.tagColor}22`,
              }}
            >
              <Text style={{ ...typography.captionSemiBold, color: item.tagColor }}>{item.tag}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleAddCalendarItem}
          style={{
            marginTop: spacing.sm,
            alignItems: 'center',
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>+ Add Event</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Calendar Item Modal */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Edit Event</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: spacing.md }}>
              <View>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Title</Text>
                <TextInput
                  value={editForm.title}
                  onChangeText={(value) => setEditForm((prev) => ({ ...prev, title: value }))}
                  placeholder="Event title"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Date</Text>
                <TouchableOpacity
                  onPress={() => setShowCalendarDatePicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surfaceMuted,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: editForm.date ? colors.textPrimary : colors.textMuted }}>
                    {editForm.date || 'Select date'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                </TouchableOpacity>
                {showCalendarDatePicker && (
                  <DateTimePicker
                    value={editForm.date ? new Date(editForm.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowCalendarDatePicker(false);
                      if (selectedDate) {
                        setEditForm((prev) => ({ ...prev, date: selectedDate.toISOString().slice(0, 10) }));
                      }
                    }}
                  />
                )}
              </View>

              <View>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Time</Text>
                <TextInput
                  value={editForm.time}
                  onChangeText={(value) => setEditForm((prev) => ({ ...prev, time: value }))}
                  placeholder="2:00 PM"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Tag</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {tagOptions.map((tag) => (
                    <TouchableOpacity
                      key={tag.value}
                      onPress={() => handleSelectTag(tag.value, tag.color)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                        backgroundColor: editForm.tag === tag.value ? tag.color : `${tag.color}22`,
                        borderWidth: 1,
                        borderColor: tag.color,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.caption,
                          color: editForm.tag === tag.value ? '#FFFFFF' : tag.color,
                          fontWeight: '600',
                        }}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{
                marginTop: spacing.lg,
                backgroundColor: colors.textPrimary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEventTypeModal} transparent animationType="slide" onRequestClose={() => setShowEventTypeModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => setShowEventTypeModal(false)} />
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, width: '100%', maxWidth: 400, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Select Event Type</Text>
              <TouchableOpacity onPress={() => setShowEventTypeModal(false)}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setEventDetails((prev) => ({ ...prev, type }));
                    setShowEventTypeModal(false);
                  }}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: eventDetails.type === type ? colors.primary : 'transparent',
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text style={{ color: eventDetails.type === type ? colors.primaryForeground : colors.textPrimary }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
