
import { supabase } from '../lib/supabaseClient';

export type ShortlistItem = {
    id: number;
    vendor_id: number;
    vendor: {
        id: number;
        name: string;
        image_url: string | null;
        price_range: string | null;
        rating: number | null;
        review_count: number | null;
        city?: string | null;
        province?: string | null;
    } | null;
};

export const ShortlistService = {
    async getUserId(): Promise<number | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Try to find the user in the users table
            const { data: userRows } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .limit(1);

            if (userRows && userRows.length > 0) {
                return userRows[0].id;
            }
        }

        // Fallback for demo: look for 'demo_attendee'
        const { data: demoRows } = await supabase
            .from('users')
            .select('id')
            .eq('username', 'demo_attendee')
            .limit(1);

        return demoRows?.[0]?.id ?? null;
    },

    async isShortlisted(vendorId: number): Promise<boolean> {
        const userId = await this.getUserId();
        if (!userId) return false;

        const { data, error } = await supabase
            .from('shortlists')
            .select('id')
            .eq('user_id', userId)
            .eq('vendor_id', vendorId)
            .limit(1);

        if (error) {
            console.error('Error checking shortlist status:', error);
            return false;
        }

        return (data && data.length > 0);
    },

    async toggleShortlist(vendorId: number): Promise<boolean> {
        const userId = await this.getUserId();
        if (!userId) throw new Error('User not found');

        const isStartlisted = await this.isShortlisted(vendorId);

        if (isStartlisted) {
            const { error } = await supabase
                .from('shortlists')
                .delete()
                .eq('user_id', userId)
                .eq('vendor_id', vendorId);

            if (error) throw error;
            return false; // Now not shortlisted
        } else {
            const { error } = await supabase
                .from('shortlists')
                .insert({
                    user_id: userId,
                    vendor_id: vendorId,
                    status: 'active'
                });

            if (error) throw error;
            return true; // Now shortlisted
        }
    },

    async getShortlist(): Promise<ShortlistItem[]> {
        const userId = await this.getUserId();
        console.log('[ShortlistService] getShortlist userId:', userId);

        if (!userId) return [];

        // Step 1: Get Shortlist IDs
        const { data: shortlistRows, error: shortlistError } = await supabase
            .from('shortlists')
            .select('id, vendor_id')
            .eq('user_id', userId);

        if (shortlistError) {
            console.error('[ShortlistService] Error fetching shortlist rows:', shortlistError);
            throw shortlistError;
        }

        if (!shortlistRows || shortlistRows.length === 0) {
            console.log('[ShortlistService] No rows found for user:', userId);
            return [];
        }

        console.log('[ShortlistService] Found rows:', shortlistRows.length);

        const vendorIds = shortlistRows.map(r => r.vendor_id);

        // Step 2: Get Vendors
        const { data: vendors, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name, image_url, price_range, rating, review_count, city, province')
            .in('id', vendorIds);

        if (vendorError) {
            console.error('[ShortlistService] Error fetching vendors:', vendorError);
            throw vendorError;
        }

        // Merge
        return shortlistRows.map(row => {
            const vendor = vendors?.find(v => v.id === row.vendor_id) || null;
            return {
                id: row.id,
                vendor_id: row.vendor_id,
                vendor
            };
        });
    }
};
