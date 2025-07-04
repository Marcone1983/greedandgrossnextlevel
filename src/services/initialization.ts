import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
// TODO: Replace with react-native-push-notification or @notifee/react-native
// import * as Notifications from 'expo-notifications';
import { REVENUECAT_APPLE_KEY, REVENUECAT_GOOGLE_KEY } from '@env';
import { getUser } from './storage';
import { saveUserToFirebase, logAnalytics } from './firebase';
import { resetDailyUsage } from '@/store/slices/authSlice';
import { store } from '@/store';
import { errorLogger } from './errorLogger';

export async function initializeServices() {
  try {
    // Initialize RevenueCat
    await initializeRevenueCat();

    // Initialize Notifications
    await initializeNotifications();

    // Check and restore user session
    await restoreUserSession();

    // Set up daily reset
    scheduleDailyReset();

    // Log app open
    logAnalytics('app_open', {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger.error('Initialization error', error, 'initializeServices');
  }
}

async function initializeRevenueCat() {
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_APPLE_KEY : REVENUECAT_GOOGLE_KEY;

    if (apiKey) {
      Purchases.configure({ apiKey });

      // Set up listener for purchase updates
      Purchases.addCustomerInfoUpdateListener(info => {
        // Update user subscription status
        const hasActiveSubscription = info.activeSubscriptions.length > 0;
        if (hasActiveSubscription) {
          store.dispatch({
            type: 'auth/updateUser',
            payload: { tier: 'premium' },
          });
        }
      });
    }
  } catch (error) {
    // RevenueCat initialization error
  }
}

async function initializeNotifications() {
  // TODO: Implement with react-native-push-notification
  // Temporarily disabled - notifications will be implemented later
  /*
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      // Configure notification handling
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (error) {
    // Notifications initialization error
  }
  */
}

async function restoreUserSession() {
  try {
    const user = await getUser();
    if (user) {
      // Update last active
      user.lastActive = new Date();

      // Sync with Firebase
      await saveUserToFirebase(user);

      // Restore to Redux
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: user,
      });
    }
  } catch (error) {
    // Session restore error
  }
}

function scheduleDailyReset() {
  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();

  // Schedule first reset
  setTimeout(() => {
    store.dispatch(resetDailyUsage());

    // Schedule recurring daily resets
    setInterval(
      () => {
        store.dispatch(resetDailyUsage());
      },
      24 * 60 * 60 * 1000
    );
  }, timeUntilMidnight);
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    // Subscription check error
    return false;
  }
}

export async function purchaseSubscription(productId: string) {
  try {
    const { customerInfo } = await Purchases.purchaseProduct(productId);
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error: any) {
    if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new Error('Acquisto annullato');
    }
    throw error;
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.activeSubscriptions.length > 0;
  } catch (error) {
    throw new Error('Impossibile ripristinare acquisti');
  }
}
