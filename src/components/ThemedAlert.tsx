import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type ThemedAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
};

export default function ThemedAlert({ visible, title, message, buttons, onDismiss }: ThemedAlertProps) {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible]);

  const handlePress = (btn: AlertButton) => {
    onDismiss?.();
    btn.onPress?.();
  };

  const btnDefs = buttons?.length ? buttons : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.box,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.buttonRow}>
            {btnDefs.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    isDestructive
                      ? styles.btnDestructive
                      : isCancel
                      ? styles.btnCancel
                      : styles.btnPrimary,
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive
                        ? styles.btnTextDestructive
                        : isCancel
                        ? styles.btnTextCancel
                        : styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    ...typography.titleMedium,
    fontSize: 20,
    fontWeight: '700',
    color: '#123f5c',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontSize: 14,
    color: '#000000',
    marginBottom: 22,
    lineHeight: 21,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: radii.md,
    minWidth: 100,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#123f5c',
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnCancel: {
    backgroundColor: '#123f5c',
  },
  btnTextCancel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnDestructive: {
    backgroundColor: '#DC2626',
  },
  btnTextDestructive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
