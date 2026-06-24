import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function useVendorStatus() {
  const { user, userRole } = useAuth();

  const { data: vendorData, isLoading, error } = useQuery({
    queryKey: ['vendor-status', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return null;

      if (userRole === 'vendor') {
        return { id: user.id, name: undefined, email: user.email } as any;
      }
      if (userRole === 'attendee') {
        return null;
      }

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
