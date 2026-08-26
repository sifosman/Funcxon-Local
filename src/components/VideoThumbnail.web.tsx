import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type VideoThumbnailProps = {
  uri: string;
  style?: any;
  resizeMode?: any;
  showPlayIcon?: boolean;
  playIconSize?: number;
};

/**
 * Web implementation of VideoThumbnail.
 *
 * expo-video-thumbnails is not supported on web, so on web we render an
 * HTML5 <video> element with preload="metadata" so the browser shows the
 * first frame of the clip. A play icon overlay is rendered on top so the
 * user can clearly see the tile is a video.
 */
export default function VideoThumbnail({
  uri,
  style,
  showPlayIcon = true,
  playIconSize = 32,
}: VideoThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setFailed(false);
    // Try to load metadata so the first frame is displayed.
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [uri]);

  const objectFit = 'cover';

  return (
    <View style={[{ backgroundColor: '#000', overflow: 'hidden' as any }, style]}>
      {!failed && (
        <video
          ref={videoRef as any}
          src={uri}
          preload="metadata"
          muted
          playsInline
          // Prevent the video from taking over navigation when clicked.
          controls={false}
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
      {failed && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="videocam" size={playIconSize + 8} color={colors.textMuted} />
        </View>
      )}
      {showPlayIcon && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none' as any,
          }}
        >
          <View
            style={{
              width: playIconSize + 16,
              height: playIconSize + 16,
              borderRadius: (playIconSize + 16) / 2,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={playIconSize} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );
}
