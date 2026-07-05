import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export const fallbackEventTypes = [
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

export type Task = {
  id: number;
  title: string;
  status: string | null;
  due_date: string | null;
};

export type PlannerData = {
  tasks: Task[];
  userId: number | null;
};

export type CalendarItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  tag: string;
  tagColor: string;
};

export const tagOptions = [
  { label: 'Meeting', value: 'meeting', color: '#3B82F6' },
  { label: 'Appointment', value: 'appointment', color: '#22C55E' },
  { label: 'Reminder', value: 'reminder', color: '#F59E0B' },
  { label: 'Task', value: 'task', color: '#8B5CF6' },
];

export const BUDGET_COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export type BudgetItem = {
  name: string;
  spent: number;
  total: number;
  color?: string;
};

export type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  buttons?: any[];
};

export function usePlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [eventDetails, setEventDetails] = useState({
    name: '',
    type: '',
    otherType: '',
    date: '',
    guests: 0,
    additionalNotes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarDatePicker, setShowCalendarDatePicker] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { name: 'Venue', spent: 0, total: 0, color: BUDGET_COLORS[0] },
    { name: 'Catering', spent: 0, total: 0, color: BUDGET_COLORS[1] },
    { name: 'Photography', spent: 0, total: 0, color: BUDGET_COLORS[2] },
    { name: 'Flowers', spent: 0, total: 0, color: BUDGET_COLORS[3] },
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
        const email = user.email ?? 'attendee@funxon.co.za';
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
    const tempTask: Task = {
      id: Date.now(),
      title: trimmed,
      status: 'pending',
      due_date: dueDate.toISOString(),
    };
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
      await refetch();
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!data?.userId) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) } : old
    );
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
    await refetch();
  };

  const deleteTask = async (taskId: number) => {
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
    queryClient.setQueryData<PlannerData>(['planner-tasks', user?.id], (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => (t.id === editingTask.id ? { ...t, title: newTitle } : t)) } : old
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
          ? {
              ...item,
              name: editBudgetForm.name || item.name,
              spent: parseFloat(editBudgetForm.spent) || 0,
              total: parseFloat(editBudgetForm.total) || 0,
            }
          : item
      )
    );
    setEditingBudgetIdx(null);
  };

  const handleAddBudgetItem = () => {
    const newColor = BUDGET_COLORS[budgetItems.length % BUDGET_COLORS.length];
    setBudgetItems((prev) => [...prev, { name: 'New Item', spent: 0, total: 0, color: newColor }]);
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

  return {
    eventDetails,
    setEventDetails,
    showDatePicker,
    setShowDatePicker,
    showCalendarDatePicker,
    setShowCalendarDatePicker,
    newTask,
    setNewTask,
    editingTask,
    setEditingTask,
    editTaskTitle,
    setEditTaskTitle,
    addingTask,
    setAddingTask,
    alertState,
    setAlertState,
    budgetItems,
    setBudgetItems,
    editingBudgetIdx,
    setEditingBudgetIdx,
    editBudgetForm,
    setEditBudgetForm,
    calendarItems,
    setCalendarItems,
    editingItem,
    setEditingItem,
    editForm,
    setEditForm,
    showEventTypeModal,
    setShowEventTypeModal,
    eventTypes,
    tasks,
    remainingTasks,
    budgetTotals,
    isLoading,
    error,
    refetch,
    handleAddTask,
    toggleTask,
    deleteTask,
    handleEditTask,
    handleSaveTaskEdit,
    handleEditBudget,
    handleSaveBudget,
    handleAddBudgetItem,
    handleDeleteBudgetItem,
    handleAddCalendarItem,
    handleEditItem,
    handleSaveEdit,
    handleDeleteItem,
    handleSelectTag,
  };
}
