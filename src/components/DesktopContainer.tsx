import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { spacing } from '../theme';

type DesktopContainerProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  maxWidth?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
};

export default function DesktopContainer({
  children,
  style,
  maxWidth = spacing.maxWidth,
  paddingHorizontal = spacing.marginDesktop,
  paddingVertical = 0,
}: DesktopContainerProps) {
  if (Platform.OS !== 'web') {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, { maxWidth, paddingHorizontal, paddingVertical }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center' as const,
  } as any,
});
