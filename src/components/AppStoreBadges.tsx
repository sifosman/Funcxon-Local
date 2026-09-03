import { TouchableOpacity, View, Image, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Linking } from 'react-native';
import { spacing } from '../theme';

// Official Store Badge images
// Google Play: downloaded from https://appure.io/badges/playstore/en.svg (official Google artwork)
// App Store: downloaded from https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us (official Apple artwork)
const GooglePlayBadge = require('../../assets/google-play-badge.png');
const AppStoreBadge = require('../../assets/app-store-badge.png');

// Store URLs — update these once the apps are published
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.anonymous.vibeventzapp';
const APPLE_APP_STORE_URL = 'https://apps.apple.com/app/funxon/idXXXXXXX';

type Props = {
  style?: ViewStyle;
};

export function AppStoreBadges({ style }: Props) {
  // Store badges are only relevant on web (mobile + desktop browsers).
  // On native iOS/Android the user already has the app installed.
  if (Platform.OS !== 'web') {
    return null;
  }

  const openGooglePlay = () => {
    Linking.openURL(GOOGLE_PLAY_URL).catch(() => {});
  };

  const openAppStore = () => {
    Linking.openURL(APPLE_APP_STORE_URL).catch(() => {});
  };

  return (
    <View style={[styles.container, style]}>
      {/* Google Play Badge */}
      <TouchableOpacity
        onPress={openGooglePlay}
        activeOpacity={0.85}
      >
        <Image
          source={GooglePlayBadge}
          style={styles.googlePlayBadge}
          resizeMode="contain"
          accessibilityLabel="Get it on Google Play"
        />
      </TouchableOpacity>

      {/* Apple App Store Badge */}
      <TouchableOpacity
        onPress={openAppStore}
        activeOpacity={0.85}
      >
        <Image
          source={AppStoreBadge}
          style={styles.appStoreBadge}
          resizeMode="contain"
          accessibilityLabel="Download on the App Store"
        />
      </TouchableOpacity>
    </View>
  );
}

const BADGE_HEIGHT = 48;

// Pixel dimensions of the rendered PNGs
const GOOGLE_PLAY_PNG = { width: 479, height: 142 };
const APP_STORE_PNG = { width: 480, height: 160 };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  googlePlayBadge: {
    height: BADGE_HEIGHT,
    width: BADGE_HEIGHT * (GOOGLE_PLAY_PNG.width / GOOGLE_PLAY_PNG.height),
  },
  appStoreBadge: {
    height: BADGE_HEIGHT,
    width: BADGE_HEIGHT * (APP_STORE_PNG.width / APP_STORE_PNG.height),
  },
});

export default AppStoreBadges;