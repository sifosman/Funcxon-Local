import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

const PENDING_SUBSCRIPTION_CHECKOUT_KEY = 'pending_subscription_checkout';

type PendingSubscriptionCheckoutParams = ProfileStackParamList['SubscriptionCheckout'];

export async function savePendingSubscriptionCheckout(params: PendingSubscriptionCheckoutParams) {
  await AsyncStorage.setItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY, JSON.stringify(params));
}

export async function getPendingSubscriptionCheckout(): Promise<PendingSubscriptionCheckoutParams | null> {
  const rawValue = await AsyncStorage.getItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PendingSubscriptionCheckoutParams;
  } catch {
    await AsyncStorage.removeItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
    return null;
  }
}

export async function clearPendingSubscriptionCheckout() {
  await AsyncStorage.removeItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
}
