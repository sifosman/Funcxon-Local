import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for production builds
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fhlocaqndxawkbztncwo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobG9jYXFuZHhhd2tienRuY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ1NzksImV4cCI6MjA3ODg3MDU3OX0.8vDYyxqe7AfHsvNnd2csFNIFaotjdcbUp9Tr2J3V9As';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not found, using fallback values');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
