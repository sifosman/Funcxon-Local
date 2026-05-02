const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude react-native-maps from web bundle
config.resolver.platforms = ['ios', 'android', 'native'];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
