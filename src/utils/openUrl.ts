import { Linking, Platform } from 'react-native';

export async function openExternalUrl(url?: string | null) {
  if (!url) return;
  if (Platform.OS === 'web' && url.startsWith('mailto:')) {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    // ignore failures to open external URLs
  }
}
