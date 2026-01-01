import React, { useState } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';
import { supabase } from '../lib/supabaseClient';

export default function PaymentScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<QuotesStackParamList, 'Payment'>>();
    const { paymentUrl, depositId } = route.params;

    const handleNavigationStateChange = async (navState: any) => {
        const { url } = navState;

        if (url.includes('payment/return')) {
            // Success
            await handlePaymentSuccess();
        } else if (url.includes('payment/cancel')) {
            // Cancel
            Alert.alert('Payment Cancelled', 'You cancelled the transaction.');
            navigation.goBack();
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            // Update deposit status
            const { error } = await supabase
                .from('booking_deposits')
                .update({ payment_status: 'paid' })
                .eq('id', depositId);

            if (error) throw error;

            // Also update the quote status to 'booked' if not already?
            // Or maybe the deposit being paid is enough trigger.
            // Let's explicitly update quote to 'booked'.
            // First get the quote ID from deposit? Or we can trust the flow.
            // Ideally we'd do this via webhook/edge function for security, but for this demo client-side is okay.

            const { data: deposit } = await supabase
                .from('booking_deposits')
                .select('quote_request_id')
                .eq('id', depositId)
                .single();

            if (deposit) {
                await supabase
                    .from('quote_requests')
                    .update({ status: 'booked' })
                    .eq('id', deposit.quote_request_id);
            }

            Alert.alert('Payment Successful', 'Your booking is confirmed!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', 'Payment recorded but status update failed: ' + e.message);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <WebView
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}
            />
        </View>
    );
}
