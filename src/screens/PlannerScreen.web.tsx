import { ActivityIndicator, KeyboardAvoidingView, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { usePlanner, tagOptions } from '../hooks/usePlanner';
import ThemedAlert from '../components/ThemedAlert';

type PlannerProps = NativeStackScreenProps<AttendeeStackParamList, 'Planner'>;

function WebDateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        color: value ? colors.textPrimary : colors.textMuted,
        fontSize: 14,
        fontFamily: 'inherit',
        outline: 'none',
      }}
    />
  );
}

function BudgetPieChart({
  budgetItems,
  total,
}: {
  budgetItems: { name: string; total: number; color?: string }[];
  total: number;
}) {
  const activeItems = budgetItems.filter((b) => b.total > 0);
  let cumulative = 0;
  const segments = activeItems.map((item) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += item.total;
    const endAngle = (cumulative / total) * 360;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const color = item.color || colors.primary;
    return {
      path: `M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A45,45 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
      color,
      name: item.name,
      value: item.total,
    };
  });

  return (
    <svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      {segments.map((s, idx) => (
        <path key={idx} d={s.path} fill={s.color} stroke="white" strokeWidth="0.5" />
      ))}
      <circle cx="50" cy="50" r="26" fill="white" />
      <text x="50" y="48" textAnchor="middle" fontSize="7" fill="#888" fontFamily="sans-serif">
        Total
      </text>
      <text x="50" y="57" textAnchor="middle" fontSize="8" fill="#333" fontWeight="bold" fontFamily="sans-serif">
        R{(total / 1000).toFixed(0)}k
      </text>
    </svg>
  );
}

export default function PlannerScreen({ navigation }: PlannerProps) {
  const {
    eventDetails,
    setEventDetails,
    newTask,
    setNewTask,
    editingTask,
    setEditingTask,
    editTaskTitle,
    setEditTaskTitle,
    alertState,
    setAlertState,
    budgetItems,
    editingBudgetIdx,
    setEditingBudgetIdx,
    editBudgetForm,
    setEditBudgetForm,
    calendarItems,
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
  } = usePlanner();
  const isDesktop = useIsDesktop();

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

  const renderEventDetails = () => (
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
                  {eventDetails.type === 'Other' && eventDetails.otherType
                    ? `Other - ${eventDetails.otherType}`
                    : eventDetails.type || 'Select event type'}
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
              <View
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
                <WebDateInput
                  value={eventDetails.date}
                  onChange={(date) => setEventDetails((prev) => ({ ...prev, date }))}
                  placeholder="Select event date"
                />
                <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
              </View>
            </View>
            <View>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>My Event Guests</Text>
              <TextInput
                value={eventDetails.guests === 0 ? '' : String(eventDetails.guests)}
                onChangeText={(value) => {
                  const numeric = value.replace(/[^0-9]/g, '');
                  setEventDetails((prev) => ({ ...prev, guests: numeric ? parseInt(numeric, 10) : 0 }));
                }}
                placeholder="Number of guests"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
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
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Additional Event Details</Text>
              <TextInput
                value={eventDetails.additionalNotes}
                onChangeText={(value) => setEventDetails((prev) => ({ ...prev, additionalNotes: value }))}
                placeholder="Any other details about your event"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  marginTop: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                  minHeight: 64,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>
        </View>

          );

const renderBudget = () => (
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
            <MaterialIcons name="savings" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Budget</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            {/* Pie Chart */}
            {budgetTotals.total > 0 && (
              <View style={{ width: 110, height: 110, marginRight: spacing.md }}>
                <BudgetPieChart budgetItems={budgetItems} total={budgetTotals.total} />
              </View>
            )}

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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: radii.full,
                        backgroundColor: item.color || colors.primary,
                        marginRight: spacing.sm,
                      }}
                    />
                    <Text style={{ ...typography.body, color: colors.textPrimary }}>{item.name}</Text>
                  </View>
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
                      backgroundColor: item.color || colors.primary,
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

          );

const renderTasks = () => (
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>To Do List</Text>
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
            const due = item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No due date';
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
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>{due}</Text>
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

          );

const renderDiary = () => (
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Diary</Text>
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

          );

return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }} behavior="height" keyboardVerticalOffset={0}>
      <ScrollView
        style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
        contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: 120, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 }}
      >
        {isDesktop ? null : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
          </TouchableOpacity>
        )}

        {isDesktop ? (
          <View style={{ marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Event Dashboard
              </Text>
              <Text style={{ ...typography.headlineMd, color: colors.primary }}>My Planner</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowEventTypeModal(true)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>Edit Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.captionSemiBold, color: '#FFFFFF' }}>Invite Collaborators</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>My Planner</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
              Track tasks, budget, and key dates for your event.
            </Text>
          </View>
        )}

        {isDesktop ? (
          <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
            <View style={{ flex: 7, gap: spacing.gutter } as any}>
              {renderEventDetails()}
              {renderDiary()}
            </View>
            <View style={{ flex: 5, gap: spacing.gutter } as any}>
              {renderBudget()}
              {renderTasks()}
            </View>
          </View>
        ) : (
          <>
            {renderEventDetails()}
            {renderBudget()}
            {renderTasks()}
            {renderDiary()}
          </>
        )}

        {/* Edit Diary Item Modal */}
        <Modal visible={editingItem !== null} transparent animationType="slide" onRequestClose={() => setEditingItem(null)}>
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
                  <View
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
                    <WebDateInput
                      value={editForm.date}
                      onChange={(date) => setEditForm((prev) => ({ ...prev, date }))}
                      placeholder="Select date"
                    />
                    <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                  </View>
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
                  backgroundColor: colors.cta,
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
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => setShowEventTypeModal(false)}
            />
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
