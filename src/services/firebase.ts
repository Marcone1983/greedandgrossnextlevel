import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';
import { Strain, User, AnalyticsEvent } from '@/types';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);

// Collections
const USERS_COLLECTION = 'users';
const STRAINS_COLLECTION = 'strains';
const CROSSES_CACHE_COLLECTION = 'crosses_cache';
const ANALYTICS_COLLECTION = 'analytics';

// User Management
export async function saveUserToFirebase(user: User) {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), {
      ...user,
      lastActive: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

export async function getUserFromFirebase(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Strain Cache Management
export async function checkCachedCross(parentA: string, parentB: string): Promise<Strain | null> {
  try {
    const cacheId = generateCacheId(parentA, parentB);
    const cacheDoc = await getDoc(doc(db, CROSSES_CACHE_COLLECTION, cacheId));

    if (cacheDoc.exists()) {
      const data = cacheDoc.data();
      logAnalytics('cache_hit', { parentA, parentB });
      return data.strain as Strain;
    }

    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

export async function saveCachedCross(strain: Strain) {
  try {
    const cacheId = generateCacheId(strain.parentA, strain.parentB);
    await setDoc(doc(db, CROSSES_CACHE_COLLECTION, cacheId), {
      strain,
      timestamp: Timestamp.now(),
      hitCount: 1,
    });

    logAnalytics('cache_save', { strainName: strain.name });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Popular Strains
export async function getPopularStrains(limit: number = 10): Promise<Strain[]> {
  try {
    const q = query(
      collection(db, STRAINS_COLLECTION),
      orderBy('popularity', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Strain);
  } catch (error) {
    console.error('Error getting popular strains:', error);
    return [];
  }
}

// Analytics
export function logAnalytics(event: string, data: Record<string, any> = {}) {
  try {
    logEvent(analytics, event, data);

    // Also save to Firestore for admin panel
    const analyticsDoc: AnalyticsEvent = {
      event,
      data,
      timestamp: new Date(),
      userId: data.userId || 'anonymous',
      sessionId: data.sessionId || generateSessionId(),
    };

    setDoc(doc(collection(db, ANALYTICS_COLLECTION)), analyticsDoc);
  } catch (error) {
    console.error('Error logging analytics:', error);
  }
}

// Admin Functions
export async function getAdminStats() {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const totalUsers = usersSnapshot.size;

    const premiumUsers = usersSnapshot.docs.filter(doc => doc.data().tier === 'premium').length;

    const last24h = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersQuery = query(
      collection(db, USERS_COLLECTION),
      where('lastActive', '>', last24h)
    );
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;

    const crossesSnapshot = await getDocs(collection(db, CROSSES_CACHE_COLLECTION));
    const totalCrosses = crossesSnapshot.size;

    const popularStrains = await getPopularStrains(5);

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalCrosses,
      popularStrains,
      revenue: {
        daily: premiumUsers * 0.33, // Rough estimate
        monthly: premiumUsers * 9.99,
        yearly: premiumUsers * 99,
      },
      systemHealth: {
        apiLatency: 150,
        cacheHitRate: 0.75,
        errorRate: 0.02,
      },
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
}

// Helper Functions
function generateCacheId(parentA: string, parentB: string): string {
  // Sort parents to ensure consistent cache key
  const sorted = [parentA, parentB].sort();
  return `${sorted[0]}_x_${sorted[1]}`.toLowerCase().replace(/\s+/g, '_');
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
