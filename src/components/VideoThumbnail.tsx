import { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator, Platform } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type VideoThumbnailProps = {
  uri: string;
  style?: any;
  resizeMode?: any;
  showPlayIcon?: boolean;
  playIconSize?: number;
};

export default function VideoThumbnail({
  uri,
  style,
  resizeMode = 'cover',
  showPlayIcon = true,
  playIconSize = 32,
}: VideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFailed(false);
    setThumbnail(null);

    // expo-video-thumbnails is not supported on web
    if (Platform.OS === 'web') {
      setFailed(true);
      setLoading(false);
      return;
    }

    VideoThumbnails.getThumbnailAsync(uri, { time: 1000 })
      .then((result) => {
        if (mounted) {
          setThumbnail(result.uri);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [uri]);

  if (loading) {
    return (
      <View style={[{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }, style]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (failed || !thumbnail) {
    return (
      <View style={[{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }, style]}>
        <MaterialIcons name="videocam" size={playIconSize + 8} color={colors.textMuted} />
        {showPlayIcon && (
          <View style={{ position: 'absolute', width: playIconSize + 16, height: playIconSize + 16, borderRadius: (playIconSize + 16) / 2, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="play-arrow" size={playIconSize} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image source={{ uri: thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode={resizeMode} />
      {showPlayIcon && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: playIconSize + 16, height: playIconSize + 16, borderRadius: (playIconSize + 16) / 2, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="play-arrow" size={playIconSize} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );
}
