import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type FloatingHelpButtonProps = {
  onPress: () => void;
  testID?: string;
};

/**
 * Floating help/chat-style button with subtle pulse animation.
 */
export default function FloatingHelpButton({ onPress, testID = 'floating-help-btn' }: FloatingHelpButtonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const shadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.28] });

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Animated.View
        style={[
          styles.shadow,
          {
            transform: [{ scale }],
            shadowOpacity: Platform.OS === 'ios' ? shadowOpacity : undefined,
            opacity: 1,
          },
        ]}
      />
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        testID={testID}
        style={styles.button}
      >
        <MaterialIcons name="support-agent" size={26} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl * 3.5, // sit higher above bottom tabs
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    opacity: 0.18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
