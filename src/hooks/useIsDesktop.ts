import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

const DESKTOP_BREAKPOINT = 768;

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerWidth >= DESKTOP_BREAKPOINT
      : false
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isDesktop;
}

export function useScreenWidth(): number {
  const [width, setWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerWidth
      : Dimensions.get('window').width
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return width;
}
