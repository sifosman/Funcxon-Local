import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';

type Task = {
  id: number;
  title: string;
  status: string | null;
  due_date: string | null;
};

export default function PlannerScreen() {
  const { data, isLoading, error } = useQuery<Task[]>({
    queryKey: ['planner-tasks'],
    queryFn: async () => {
      // For this demo, pull tasks for the demo_attendee user if present.
      const { data: userRows, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', 'demo_attendee')
        .limit(1);

      if (userError) {
        throw userError;
      }

      const demoUser = userRows?.[0];

      if (!demoUser) {
        return [];
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('user_id', demoUser.id)
        .order('due_date', { ascending: true })
        .limit(50);

      if (tasksError) {
        throw tasksError;
      }

      return (tasks as Task[]) ?? [];
    },
  });

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

  if (!data || data.length === 0) {
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
        <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
          No tasks yet for the demo planner.
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            ...typography.body,
            color: colors.textMuted,
          }}
        >
          Add a few rows into the tasks table for the demo_attendee user to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        }}
      >
        My planner tasks (demo)
      </Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => {
          const due = item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No due date';

          return (
            <View
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Status: {item.status ?? 'unknown'}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Due: {due}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
