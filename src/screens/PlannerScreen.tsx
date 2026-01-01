import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { PrimaryButton } from '../components/ui';

type Task = {
  id: number;
  title: string;
  status: string | null;
  due_date: string | null;
};

export default function PlannerScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, error } = useQuery<Task[]>({
    queryKey: ['planner-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Get the integer user ID from the 'users' table using the Auth ID
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userRow) throw new Error('User not found');

      // 2. Fetch tasks for this user
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userRow.id)
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;
      return tasks ?? [];
    },
    enabled: !!user,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!userRow) throw new Error('User not found');

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: userRow.id,
          title: title,
          status: 'pending',
          due_date: newTaskDate
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      setIsModalVisible(false);
      setNewTaskTitle('');
      Alert.alert('Success', 'Task added to your planner');
    },
    onError: (err) => {
      Alert.alert('Error', err.message);
    }
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
            My Planner
          </Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <MaterialIcons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
          Keep track of your wedding to-dos.
        </Text>
      </View>

      {!data || data.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <MaterialIcons name="event-note" size={48} color={colors.borderSubtle} />
          <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
            No tasks yet. Tap the + button to add your first to-do!
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.sm,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View>
                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                  {item.title}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                  Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.full, backgroundColor: item.status === 'completed' ? colors.primary : colors.surfaceMuted }}>
                <Text style={{ ...typography.caption, color: item.status === 'completed' ? '#FFF' : colors.textPrimary }}>
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg }}>
            <Text style={{ ...typography.titleMedium, marginBottom: spacing.md }}>New Task</Text>

            <TextInput
              placeholder="Task title (e.g. Book DJ)"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                ...typography.body
              }}
            />

            <PrimaryButton
              title={addTaskMutation.isPending ? "Adding..." : "Add Task"}
              onPress={() => {
                if (newTaskTitle.trim()) addTaskMutation.mutate(newTaskTitle);
              }}
            />

            <TouchableOpacity
              style={{ marginTop: spacing.md, alignItems: 'center' }}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={{ ...typography.body, color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
