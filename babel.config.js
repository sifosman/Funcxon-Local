module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      allowlist: [
        'EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN',
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
      ],
    }]
  ]
};
