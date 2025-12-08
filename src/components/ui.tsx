import type { ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, TouchableOpacity, type ViewStyle, View } from 'react-native';

import { colors, spacing, radii, typography } from '../theme';

export type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, disabled, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? colors.accent : colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.8 : 1,
        ...(style ?? {}),
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export type OutlineButtonProps = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function OutlineButton({ title, onPress, style }: OutlineButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...(style ?? {}),
      }}
    >
      <Text
        style={{
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function FilterChip({ label, selected, onPress, style }: FilterChipProps) {
  const backgroundColor = selected ? colors.primaryTeal : colors.chipBackground;
  const textColor = selected ? '#FFFFFF' : colors.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        backgroundColor,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.borderSubtle,
        ...(style ?? {}),
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 13,
          fontWeight: selected ? '600' : '500',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export type ThemedInputProps = TextInputProps & {
  errorText?: string;
};

export function ThemedInput({ errorText, style, ...rest }: ThemedInputProps) {
  const borderColor = errorText ? colors.primaryTeal : colors.inputBorder;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <TextInput
        {...rest}
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.inputBackground,
          fontSize: 14,
          ...(style ? (style as object) : {}),
        }}
      />
      {errorText ? (
        <Text
          style={{
            marginTop: 4,
            fontSize: 12,
            color: colors.primaryTeal,
          }}
        >
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

export type SectionHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <View
      style={{
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
