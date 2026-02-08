import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to determine if the current authenticated user is a vendor
 * Tries multiple methods to identify vendor status based on database schema
 */
export function useVendorStatus() {
  const { user, userRole } = useAuth();

  const { data: vendorData, isLoading, error } = useQuery({
    queryKey: ['vendor-status', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return null;

      // Primary source of truth: AuthContext role detection
      if (userRole === 'vendor') {
        return { id: user.id, name: undefined, email: user.email } as any;
      }
      if (userRole === 'attendee') {
        return null;
      }
      
      // Fallback method 1: Check by user_id
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        // No vendor found, try next method
      }

      // Fallback method 2: Check by email
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, email')
          .eq('email', user.email)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        // Column might not exist, try next method
      }

      // Fallback method 3: Check if user email is in whatsapp_number field
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, email')
          .eq('whatsapp_number', user.email)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        // No vendor found
      }

      return null;
    },
    enabled: !!user?.id,
  });

  const isVendor = !!vendorData;
  const vendorId = vendorData?.id;

  return {
    isVendor,
    vendorId,
    vendorName: vendorData?.name,
    isLoading,
    error,
  };
}
