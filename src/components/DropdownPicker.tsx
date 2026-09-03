import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

interface DropdownPickerProps {
  label: string;
  selectedValues: string[];
  onConfirm: (values: string[]) => void;
  options: string[];
  multi?: boolean;
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export default function DropdownPicker({
  label,
  selectedValues,
  onConfirm,
  options,
  multi = false,
  placeholder,
  searchable = true,
  required = false,
  disabled = false,
}: DropdownPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  const openModal = () => {
    if (disabled) return;
    setTempSelected([...selectedValues]);
    setSearch('');
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const toggleOption = (option: string) => {
    if (multi) {
      setTempSelected((prev) =>
        prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
      );
    } else {
      setTempSelected([option]);
      onConfirm([option]);
      closeModal();
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
    closeModal();
  };

  const handleClear = () => {
    setTempSelected([]);
    if (multi) {
      onConfirm([]);
      closeModal();
    } else {
      onConfirm([]);
      closeModal();
    }
  };

  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  const displayText = selectedValues.length === 0
    ? (placeholder || `Select ${label.toLowerCase()}`)
    : selectedValues.length === 1
      ? selectedValues[0]
      : `${selectedValues.length} selected`;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
        {label}
        {required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
      <TouchableOpacity
        onPress={openModal}
        disabled={disabled}
        style={{
          borderWidth: 1,
          borderColor: disabled ? colors.borderSubtle : colors.borderSubtle,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: disabled ? colors.surfaceMuted : colors.surfaceMuted,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <Text
          style={{
            ...typography.body,
            color: selectedValues.length === 0 ? colors.textMuted : colors.textPrimary,
            flex: 1,
            fontFamily: typography.body.fontFamily,
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={colors.textMuted} />
      </TouchableOpacity>

      {selectedValues.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
          {selectedValues.map((val) => (
            <View
              key={val}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radii.full,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.caption, color: colors.textPrimary }}>{val}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                padding: spacing.lg,
                maxHeight: '75%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  {label}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {searchable && (
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceMuted,
                    marginBottom: spacing.md,
                    fontFamily: typography.body.fontFamily,
                  }}
                />
              )}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingBottom: spacing.xl }}
              >
                {filteredOptions.map((option) => {
                  const isSelected = tempSelected.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => toggleOption(option)}
                      style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : '#D1D5DB',
                          backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                          marginRight: spacing.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                      </View>
                      <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
                {filteredOptions.length === 0 && (
                  <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg }}>
                    No options found
                  </Text>
                )}
              </ScrollView>

              {multi && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md }}>
                  <TouchableOpacity
                    onPress={handleClear}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...typography.body, color: colors.textSecondary }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
