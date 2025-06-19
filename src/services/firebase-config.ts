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
  limit,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
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
import { Strain, User, AnalyticsEvent, ChatMessage } from '@/types';

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
export const COLLECTIONS = {
  USERS: 'users',
  STRAINS: 'strains',
  CROSSES_CACHE: 'crosses_cache',
  ANALYTICS: 'analytics',
  CHATS: 'chats',
  TERPENE_PROFILES: 'terpene_profiles',
  BREEDING_TIPS: 'breeding_tips',
  SYSTEM: 'system',
} as const;

// Enhanced User Management
export async function saveUserToFirebase(user: User) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
      ...user,
      lastActive: Timestamp.now(),
      joinDate: Timestamp.fromDate(user.joinDate),
    });
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

export async function getUserFromFirebase(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        ...userData,
        joinDate: userData.joinDate.toDate(),
        lastActive: userData.lastActive.toDate(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function updateUserStats(userId: string, stats: Partial<User['stats']>) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      [`stats.${Object.keys(stats)[0]}`]: Object.values(stats)[0],
      lastActive: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Enhanced Strain Cache Management
export async function checkCachedCross(parentA: string, parentB: string): Promise<Strain | null> {
  try {
    const cacheId = generateCacheId(parentA, parentB);
    const cacheDoc = await getDoc(doc(db, COLLECTIONS.CROSSES_CACHE, cacheId));
    
    if (cacheDoc.exists()) {
      const data = cacheDoc.data();
      
      // Update hit count
      await updateDoc(doc(db, COLLECTIONS.CROSSES_CACHE, cacheId), {
        hitCount: (data.hitCount || 0) + 1,
        lastAccessed: Timestamp.now(),
      });
      
      logAnalytics('cache_hit', { parentA, parentB, cacheId });
      
      return {
        ...data.strain,
        createdAt: data.strain.createdAt.toDate(),
      } as Strain;
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
    await setDoc(doc(db, COLLECTIONS.CROSSES_CACHE, cacheId), {
      strain: {
        ...strain,
        createdAt: Timestamp.fromDate(strain.createdAt),
      },
      timestamp: Timestamp.now(),
      hitCount: 1,
      lastAccessed: Timestamp.now(),
    });
    
    logAnalytics('cache_save', { strainName: strain.name, cacheId });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Popular Strains with Real-time Updates
export async function getPopularStrains(limitCount: number = 10): Promise<any[]> {
  try {
    const popularStrainsDoc = await getDoc(doc(db, COLLECTIONS.SYSTEM, 'popular_strains'));
    
    if (popularStrainsDoc.exists()) {
      const data = popularStrainsDoc.data();
      return Object.values(data)
        .sort((a: any, b: any) => b.popularity_score - a.popularity_score)
        .slice(0, limitCount);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting popular strains:', error);
    return [];
  }
}

export async function updateStrainPopularity(strainName: string) {
  try {
    const popularStrainsRef = doc(db, COLLECTIONS.SYSTEM, 'popular_strains');
    const strainKey = strainName.toLowerCase().replace(/\s+/g, '_');
    
    await updateDoc(popularStrainsRef, {
      [`${strainKey}.requests`]: (await getDoc(popularStrainsRef)).data()?.[strainKey]?.requests + 1 || 1,
      [`${strainKey}.name`]: strainName,
      [`${strainKey}.last_requested`]: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating strain popularity:', error);
  }
}

// Real-time Chat Functions
export async function sendChatMessage(message: ChatMessage) {
  try {
    await addDoc(collection(db, COLLECTIONS.CHATS), {
      ...message,
      timestamp: Timestamp.fromDate(message.timestamp),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getRecentMessages(limitCount: number = 50): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.CHATS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })).reverse() as ChatMessage[];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

export function subscribeToChatMessages(callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.CHATS),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp.toDate(),
    })).reverse() as ChatMessage[];
    
    callback(messages);
  });
}

// Terpene Profiles
export async function getTerpeneProfiles(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TERPENE_PROFILES));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting terpene profiles:', error);
    return [];
  }
}

export async function getTerpeneProfile(terpeneName: string): Promise<any | null> {
  try {
    const terpeneDoc = await getDoc(doc(db, COLLECTIONS.TERPENE_PROFILES, terpeneName.toLowerCase()));
    if (terpeneDoc.exists()) {
      return { id: terpeneDoc.id, ...terpeneDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting terpene profile:', error);
    return null;
  }
}

// Breeding Tips
export async function getBreedingTips(category?: string, difficulty?: string): Promise<any[]> {
  try {
    let q = collection(db, COLLECTIONS.BREEDING_TIPS);
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting breeding tips:', error);
    return [];
  }
}

// Enhanced Analytics
export function logAnalytics(event: string, data: Record<string, any> = {}) {
  try {
    // Firebase Analytics
    logEvent(analytics, event, data);
    
    // Custom Firestore Analytics
    const analyticsDoc: AnalyticsEvent = {
      event,
      data,
      timestamp: new Date(),
      userId: data.userId || 'anonymous',
      sessionId: data.sessionId || generateSessionId(),
    };
    
    addDoc(collection(db, COLLECTIONS.ANALYTICS), {
      ...analyticsDoc,
      timestamp: Timestamp.fromDate(analyticsDoc.timestamp),
    });
  } catch (error) {
    console.error('Error logging analytics:', error);
  }
}

// Admin Functions
export async function getSystemStats() {
  try {
    const statsDoc = await getDoc(doc(db, COLLECTIONS.SYSTEM, 'stats'));
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        ...data,
        last_updated: data.last_updated.toDate(),
      };
    }
    
    // Fallback: Calculate stats from collections
    const [usersSnapshot, strainsSnapshot, crossesSnapshot, analyticsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.STRAINS)),
      getDocs(collection(db, COLLECTIONS.CROSSES_CACHE)),
      getDocs(query(collection(db, COLLECTIONS.ANALYTICS), limit(1000))),
    ]);
    
    const totalUsers = usersSnapshot.size;
    const premiumUsers = usersSnapshot.docs.filter(
      doc => doc.data().tier === 'premium'
    ).length;
    
    const last24h = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('lastActive', '>', last24h)
    );
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;
    
    const totalCrosses = crossesSnapshot.size;
    
    const stats = {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalCrosses,
      revenue: {
        daily: premiumUsers * 0.33,
        monthly: premiumUsers * 9.99,
        yearly: premiumUsers * 99,
      },
      systemHealth: {
        apiLatency: 150,
        cacheHitRate: 0.75,
        errorRate: 0.02,
      },
      last_updated: new Date(),
    };
    
    // Save calculated stats
    await setDoc(doc(db, COLLECTIONS.SYSTEM, 'stats'), {
      ...stats,
      last_updated: Timestamp.fromDate(stats.last_updated),
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
}

export async function exportDatabase(format: 'json' | 'csv' = 'json') {
  try {
    const collections = [
      COLLECTIONS.USERS,
      COLLECTIONS.STRAINS,
      COLLECTIONS.CROSSES_CACHE,
      COLLECTIONS.ANALYTICS,
      COLLECTIONS.CHATS,
    ];
    
    const exportData: any = {};
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      exportData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Convert to CSV format
      let csvContent = '';
      for (const [collectionName, documents] of Object.entries(exportData)) {
        csvContent += `\n\n--- ${collectionName.toUpperCase()} ---\n`;
        if (Array.isArray(documents) && documents.length > 0) {
          const headers = Object.keys(documents[0]);
          csvContent += headers.join(',') + '\n';
          
          documents.forEach((doc: any) => {
            const row = headers.map(header => {
              const value = doc[header];
              return typeof value === 'object' ? JSON.stringify(value) : value;
            });
            csvContent += row.join(',') + '\n';
          });
        }
      }
      return csvContent;
    }
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
}

// Helper Functions
function generateCacheId(parentA: string, parentB: string): string {
  const sorted = [parentA, parentB].sort();
  return `${sorted[0]}_x_${sorted[1]}`.toLowerCase().replace(/\s+/g, '_');
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// System Health Monitoring
export async function updateSystemHealth(metrics: {
  apiLatency?: number;
  errorRate?: number;
  cacheHitRate?: number;
}) {
  try {
    await updateDoc(doc(db, COLLECTIONS.SYSTEM, 'stats'), {
      'systemHealth.apiLatency': metrics.apiLatency,
      'systemHealth.errorRate': metrics.errorRate,
      'systemHealth.cacheHitRate': metrics.cacheHitRate,
      last_updated: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating system health:', error);
  }
}