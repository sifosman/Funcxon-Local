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
      accessible
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? colors.primaryMuted : colors.primary,
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
          ...typography.button,
          color: '#FFFFFF',
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
      accessible
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
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
          ...typography.button,
          color: colors.primary,
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
  const backgroundColor = selected ? colors.primary : colors.chipBackground;
  const textColor = selected ? colors.primaryForeground : colors.textPrimary;

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
          ...typography.buttonMedium,
          color: textColor,
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
          fontFamily: typography.body.fontFamily,
          color: colors.textPrimary,
          ...(style ? (style as object) : {}),
        }}
      />
      {errorText ? (
        <Text
          style={{
            marginTop: 4,
            fontSize: 12,
            fontFamily: typography.caption.fontFamily,
            color: colors.textPrimary,
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
