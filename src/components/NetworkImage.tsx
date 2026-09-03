import { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, ImageResizeMode } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const LOGO_FALLBACK = require('../../assets/logo.png');

type NetworkImageProps = {
  uri: string | null | undefined;
  style: any;
  resizeMode?: ImageResizeMode;
  placeholderIcon?: keyof typeof MaterialIcons.glyphMap;
  placeholderIconSize?: number;
  placeholderBg?: string;
  showLoader?: boolean;
  useLogoFallback?: boolean;
};

export default function NetworkImage({
  uri,
  style,
  resizeMode = 'cover',
  placeholderIcon = 'image',
  placeholderIconSize = 28,
  placeholderBg,
  showLoader = false,
  useLogoFallback = true,
}: NetworkImageProps) {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErrored(false);
    setLoading(Boolean(uri));
  }, [uri]);

  if (!uri || errored) {
    if (useLogoFallback) {
      const w = typeof style?.width === 'number' ? style.width : undefined;
      const h = typeof style?.height === 'number' ? style.height : undefined;
      const logoSize = Math.min(w ?? 80, h ?? 80) * 0.5;
      return (
        <View
          style={{
            ...style,
            backgroundColor: placeholderBg ?? '#FAFAF7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={LOGO_FALLBACK}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
        </View>
      );
    }
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
