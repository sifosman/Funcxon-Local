import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';

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

export default function PlannerScreen() {
  const { user } = useAuth();
  const [eventDetails, setEventDetails] = useState({
    name: '',
    theme: '',
    type: '',
    date: '',
  });
  const [newTask, setNewTask] = useState('');
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
        const email = user.email ?? 'attendee@funcxon.com';
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
  const budgetItems = useMemo(
    () => [
      { name: 'Venue', spent: 4500, total: 5500 },
      { name: 'Catering', spent: 2800, total: 3000 },
      { name: 'Photography', spent: 0, total: 2000 },
      { name: 'Flowers', spent: 0, total: 800 },
    ],
    [],
  );
  const budgetTotals = useMemo(() => {
    const total = budgetItems.reduce((sum, item) => sum + item.total, 0);
    const spent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
    return { total, spent, remaining: total - spent };
  }, [budgetItems]);

  const handleAddTask = async () => {
    const trimmed = newTask.trim();
    if (!trimmed || !data?.userId) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    await supabase.from('tasks').insert({
      user_id: data.userId,
      title: trimmed,
      status: 'pending',
      due_date: dueDate.toISOString(),
    });
    setNewTask('');
    await refetch();
  };

  const toggleTask = async (task: Task) => {
    if (!data?.userId) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
    await refetch();
  };

  const deleteTask = async (taskId: number) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    await refetch();
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
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCalendarItems((prev) => prev.filter((item) => item.id !== itemId));
            if (editingItem?.id === itemId) {
              setEditingItem(null);
            }
          },
        },
      ]
    );
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}
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
            <TextInput
              value={eventDetails.type}
              onChangeText={(value) => setEventDetails((prev) => ({ ...prev, type: value }))}
              placeholder="Select event type"
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
            <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Date</Text>
            <TextInput
              value={eventDetails.date}
              onChangeText={(value) => setEventDetails((prev) => ({ ...prev, date: value }))}
              placeholder="yyyy/mm/dd"
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
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Total Budget:</Text>
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
            R {budgetTotals.total.toLocaleString('en-ZA')}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Total Spent:</Text>
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
            R {budgetTotals.spent.toLocaleString('en-ZA')}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Remaining:</Text>
          <Text style={{ ...typography.body, color: '#16A34A', fontWeight: '600' }}>
            R {budgetTotals.remaining.toLocaleString('en-ZA')}
          </Text>
        </View>

        {budgetItems.map((item) => {
          const progress = item.total === 0 ? 0 : Math.min(item.spent / item.total, 1);
          return (
            <View
              key={item.name}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{item.name}</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary }}>
                  R{item.spent} / R{item.total}
                </Text>
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
      </View>

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
                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{item.title}</Text>
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
              <Text style={{ ...typography.caption, color: item.tagColor, fontWeight: '600' }}>{item.tag}</Text>
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
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>+ Add Event</Text>
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
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={editForm.date}
                  onChangeText={(value) => setEditForm((prev) => ({ ...prev, date: value }))}
                  placeholder="2024-02-15"
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
                backgroundColor: colors.primaryTeal,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', ...typography.body, fontWeight: '600' }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
