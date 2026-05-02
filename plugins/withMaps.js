// Custom config plugin for react-native-maps to avoid JSX parsing issues
const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withMaps = (config, { googleMapsApiKey }) => {
  // Android: Add Google Maps API key to AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add meta-data for Google Maps API key
    const mainApplication = androidManifest.manifest.application?.[0];
    if (mainApplication) {
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }
      
      // Check if already exists
      const existing = mainApplication['meta-data'].find(
        (meta) => meta.$['android:name'] === 'com.google.android.geo.API_KEY'
      );
      
      if (!existing) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.google.android.geo.API_KEY',
            'android:value': googleMapsApiKey,
          },
        });
      }
    }
    
    return config;
  });

  // iOS: Add Google Maps API key to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.GMSApiKey = googleMapsApiKey;
    return config;
  });

  return config;
};

module.exports = withMaps;
