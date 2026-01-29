import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to determine if the current authenticated user is a vendor
 * Tries multiple methods to identify vendor status based on database schema
 */
export function useVendorStatus() {
  const { user } = useAuth();

  const { data: vendorData, isLoading, error } = useQuery({
    queryKey: ['vendor-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Method 1: Check user_id relationship (preferred method)
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, email, user_id')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        // Column might not exist yet, try next method
      }

      // Method 2: Check by email (fallback for existing data)
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, email')
          .eq('email', user.email)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        // Column might not exist, try next method
      }

      // Method 3: Check if user email is in any vendor-related field
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name')
          .or(`email.eq.${user.email},whatsapp_number.eq.${user.email},contact_email.eq.${user.email}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          return data[0];
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
