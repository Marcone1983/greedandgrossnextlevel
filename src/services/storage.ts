import { errorLogger } from './errorLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, Strain, CrossResult } from '@/types';

const STORAGE_KEYS = {
  USER: '@greed_gross_user',
  STRAINS: '@greed_gross_strains',
  CROSS_HISTORY: '@greed_gross_cross_history',
  PREFERENCES: '@greed_gross_preferences',
  ADMIN_SECRET: '@greed_gross_admin',
};

// User Management
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    errorLogger.error('Error saving user', error, 'storage.saveUser');
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    // Error getting user
    return null;
  }
}

export async function clearUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    // Error clearing user
  }
}

// Strains Management
export async function saveStrains(strains: Strain[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STRAINS, JSON.stringify(strains));
  } catch (error) {
    // Error saving strains
  }
}

export async function getStrains(): Promise<Strain[]> {
  try {
    const strainsJson = await AsyncStorage.getItem(STORAGE_KEYS.STRAINS);
    return strainsJson ? JSON.parse(strainsJson) : [];
  } catch (error) {
    // Error getting strains
    return [];
  }
}

export async function addStrain(strain: Strain): Promise<void> {
  try {
    const strains = await getStrains();
    strains.unshift(strain);
    await saveStrains(strains);
  } catch (error) {
    // Error adding strain
  }
}

// Cross History Management
export async function saveCrossHistory(history: CrossResult[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CROSS_HISTORY, JSON.stringify(history));
  } catch (error) {
    // Error saving cross history
  }
}

export async function getCrossHistory(): Promise<CrossResult[]> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.CROSS_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    // Error getting cross history
    return [];
  }
}

export async function saveCrossResult(result: CrossResult): Promise<void> {
  try {
    const history = await getCrossHistory();
    history.unshift(result);
    // Keep only last 50 crosses
    if (history.length > 50) {
      history.splice(50);
    }
    await saveCrossHistory(history);

    // Also save the strain
    await addStrain(result.result);
  } catch (error) {
    // Error saving cross result
  }
}

// Preferences
export async function savePreferences(preferences: any): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    // Error saving preferences
  }
}

export async function getPreferences(): Promise<any> {
  try {
    const prefsJson = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (error) {
    // Error getting preferences
    return {};
  }
}

// Admin Secret (Secure Store)
export async function saveAdminSecret(secret: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ADMIN_SECRET, secret);
  } catch (error) {
    // Error saving admin secret
  }
}

export async function getAdminSecret(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ADMIN_SECRET);
  } catch (error) {
    // Error getting admin secret
    return null;
  }
}

// Clear All Data
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.STRAINS,
      STORAGE_KEYS.CROSS_HISTORY,
      STORAGE_KEYS.PREFERENCES,
    ]);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ADMIN_SECRET);
  } catch (error) {
    // Error clearing all data
  }
}
