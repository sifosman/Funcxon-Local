import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useIsDesktop } from '../hooks/useIsDesktop';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

export type GalleryItem = {
  url: string;
  type: 'image' | 'video';
};

type ImageZoomModalProps = {
  visible: boolean;
  items: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ImageZoomModal({
  visible,
  items,
  initialIndex = 0,
  onClose,
}: ImageZoomModalProps) {
  const isDesktop = useIsDesktop();
  const [index, setIndex] = useState(initialIndex);
  const safeItems = items.filter((i) => i?.url);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const resetTransform = useCallback(() => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, [scale, translateX, translateY]);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      resetTransform();
    }
  }, [visible, initialIndex, resetTransform]);

  const goNext = useCallback(() => {
    resetTransform();
    setIndex((prev) => (prev + 1) % safeItems.length);
  }, [resetTransform, safeItems.length]);

  const goPrev = useCallback(() => {
    resetTransform();
    setIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);
  }, [resetTransform, safeItems.length]);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event: { scale: number }) => {
      const nextScale = startScale.value * event.scale;
      scale.value = Math.max(1, Math.min(nextScale, 4));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event: { translationX: number; translationY: number }) => {
      if (scale.value > 1) {
        translateX.value = startX.value + event.translationX;
        translateY.value = startY.value + event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2.5);
      }
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const currentItem = safeItems[index];

  if (!visible || safeItems.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Navigation arrows */}
          {safeItems.length > 1 && (
            <>
              <TouchableOpacity onPress={goPrev} style={[styles.navButtonLeft, isDesktop && styles.navButtonDesktop]}>
                <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={goNext} style={[styles.navButtonRight, isDesktop && styles.navButtonDesktop]}>
                <MaterialIcons name="chevron-right" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {/* Counter */}
          {safeItems.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {safeItems.length}
              </Text>
            </View>
          )}

          {/* Media */}
          <View style={styles.mediaContainer}>
            {currentItem?.type === 'video' ? (
              <View style={[styles.mediaWrapper, isDesktop && styles.mediaWrapperDesktop]}>
                <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; width: 100vw; overflow: hidden; }
                          video { width: 100%; height: 100%; object-fit: contain; }
                        </style>
                      </head>
                      <body>
                        <video controls playsinline webkit-playsinline preload="auto" src="${currentItem.url}" style="background:#000;"></video>
                      </body>
                    </html>
                  `,
                }}
                style={{ width: '100%', height: '100%' }}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                startInLoadingState
                allowsFullscreen
              />
              </View>
            ) : (
              <GestureDetector gesture={composed}>
                <Animated.View style={[styles.imageWrapper, isDesktop && styles.imageWrapperDesktop, animatedStyle]}>
                  <Animated.Image
                    source={{ uri: currentItem?.url }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 20,
    padding: 8,
  },
  navButtonLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: SCREEN_W,
    height: SCREEN_H * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapperDesktop: {
    width: '100%',
    height: '100%',
  },
  mediaWrapper: {
    width: '100%',
    height: '100%',
  },
  mediaWrapperDesktop: {
    maxWidth: 1000,
    maxHeight: '85%',
    alignSelf: 'center',
  },
  navButtonDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
