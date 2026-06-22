import { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, ImageResizeMode } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type NetworkImageProps = {
  uri: string | null | undefined;
  style: any;
  resizeMode?: ImageResizeMode;
  placeholderIcon?: keyof typeof MaterialIcons.glyphMap;
  placeholderIconSize?: number;
  placeholderBg?: string;
  showLoader?: boolean;
};

export default function NetworkImage({
  uri,
  style,
  resizeMode = 'cover',
  placeholderIcon = 'image',
  placeholderIconSize = 28,
  placeholderBg,
  showLoader = false,
}: NetworkImageProps) {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErrored(false);
    setLoading(Boolean(uri));
  }, [uri]);

  if (!uri || errored) {
    return (
      <View
        style={{
          ...style,
          backgroundColor: placeholderBg ?? colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={placeholderIcon} size={placeholderIconSize} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <>
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.warn('NetworkImage load error:', uri, e.nativeEvent.error);
          setErrored(true);
          setLoading(false);
        }}
      />
      {showLoader && loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </>
  );
}
