import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { memoryService } from './memoryService';

export interface UserInteraction {
  id?: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  eventType:
    | 'app_open'
    | 'breeding_simulation'
    | 'strain_view'
    | 'search'
    | 'share'
    | 'subscription'
    | 'memory_access'
    | 'settings_change';
  screen: string;
  action: string;
  metadata?: {
    strainName?: string;
    searchQuery?: string;
    simulationResult?: any;
    subscriptionTier?: string;
    settingsChanged?: string[];
    memoryOperation?: string;
    errorCode?: string;
    performanceMetric?: number;
    // Additional metadata for complex analytics
    [key: string]: any;
  };
  userAgent?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
  location?: {
    country?: string;
    timezone?: string;
  };
}

export interface ConversionEvent {
  id?: string;
  userId: string;
  eventType:
    | 'subscription_started'
    | 'subscription_upgraded'
    | 'subscription_cancelled'
    | 'in_app_purchase';
  timestamp: Date;
  value: number;
  currency: string;
  subscriptionTier?: string;
  revenue: number;
  metadata?: any;
}

export interface SystemMetric {
  id?: string;
  timestamp: Date;
  metricType:
    | 'app_performance'
    | 'error_rate'
    | 'user_retention'
    | 'feature_usage'
    | 'memory_performance';
  value: number;
  metadata?: {
    errorMessage?: string;
    feature?: string;
    loadTime?: number;
    memoryUsage?: number;
    crashData?: any;
    context?: string;
    // Additional metadata
    [key: string]: any;
  };
}

class AnalyticsCollector {
  private db = getFirestore();
  private analytics = getAnalytics();
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;
  private batchQueue: UserInteraction[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupBatchProcessing();
    this.setupErrorTracking();
  }

  // INITIALIZATION
  initialize(userId: string): void {
    this.userId = userId;
    this.trackUserSession();
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // USER INTERACTION TRACKING
  async trackUserInteraction(
    eventType: UserInteraction['eventType'],
    screen: string,
    action: string,
    metadata?: UserInteraction['metadata']
  ): Promise<void> {
    if (!this.isEnabled || !this.userId) return;

    const interaction: UserInteraction = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      eventType,
      screen,
      action,
      metadata,
      userAgent: await this.getUserAgent(),
      deviceInfo: await this.getDeviceInfo(),
      location: await this.getLocationInfo(),
    };

    // Add to batch queue
    this.batchQueue.push(interaction);

    // Immediate tracking for critical events
    if (this.isCriticalEvent(eventType)) {
      await this.flushBatch();
    }

    // Firebase Analytics event
    logEvent(
      this.analytics,
      eventType as any,
      {
        screen_name: screen,
        action,
        user_id: this.userId,
        session_id: this.sessionId,
        ...metadata,
      } as any
    );
  }

  // CONVERSION TRACKING
  async trackConversion(
    eventType: ConversionEvent['eventType'],
    value: number,
    currency: string = 'EUR',
    metadata?: any
  ): Promise<void> {
    if (!this.userId) return;

    const conversion: ConversionEvent = {
      userId: this.userId,
      eventType,
      timestamp: new Date(),
      value,
      currency,
      revenue: value,
      metadata,
    };

    try {
      await addDoc(collection(this.db, 'conversion_events'), {
        ...conversion,
        timestamp: Timestamp.fromDate(conversion.timestamp),
      });

      // Firebase Analytics purchase event
      logEvent(this.analytics, 'purchase', {
        transaction_id: this.generateSessionId(),
        value,
        currency,
        user_id: this.userId,
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // SYSTEM METRICS
  async trackSystemMetric(
    metricType: SystemMetric['metricType'],
    value: number,
    metadata?: SystemMetric['metadata']
  ): Promise<void> {
    const metric: SystemMetric = {
      timestamp: new Date(),
      metricType,
      value,
      metadata,
    };

    try {
      await addDoc(collection(this.db, 'system_metrics'), {
        ...metric,
        timestamp: Timestamp.fromDate(metric.timestamp),
      });
    } catch (error) {
      console.error('Error tracking system metric:', error);
    }
  }

  // BREEDING SIMULATION ANALYTICS
  async trackBreedingSimulation(
    parentStrain1: string,
    parentStrain2: string,
    result: any,
    _userId?: string
  ): Promise<void> {
    await this.trackUserInteraction('breeding_simulation', 'BreedingScreen', 'simulate_cross', {
      strainName: `${parentStrain1} x ${parentStrain2}`,
      simulationResult: {
        parents: [parentStrain1, parentStrain2],
        offspring: result.name,
        thc: result.thc,
        cbd: result.cbd,
        effects: result.effects,
        terpenes: result.terpenes,
      },
    });

    // Track breeding patterns for AI improvement
    await this.trackBreedingPattern(parentStrain1, parentStrain2, result);
  }

  private async trackBreedingPattern(parent1: string, parent2: string, result: any): Promise<void> {
    try {
      const pattern = {
        parent1,
        parent2,
        result: result.name,
        timestamp: Timestamp.now(),
        userId: this.userId,
        genetics: {
          thc: result.thc,
          cbd: result.cbd,
          indica: result.indica,
          sativa: result.sativa,
        },
        effects: result.effects,
        popularity: 1, // Will be aggregated
      };

      await addDoc(collection(this.db, 'breeding_patterns'), pattern);
    } catch (error) {
      console.error('Error tracking breeding pattern:', error);
    }
  }

  // SEARCH ANALYTICS
  async trackSearch(query: string, results: any[], screen: string): Promise<void> {
    await this.trackUserInteraction('search', screen, 'search_performed', {
      searchQuery: query,
      metadata: {
        resultCount: results.length,
        searchLength: query.length,
        hasResults: results.length > 0,
      },
    });

    // Track search patterns
    await this.trackSearchPattern(query, results.length);
  }

  private async trackSearchPattern(query: string, resultCount: number): Promise<void> {
    try {
      const searchData = {
        query: query.toLowerCase(),
        resultCount,
        timestamp: Timestamp.now(),
        userId: this.userId,
        sessionId: this.sessionId,
      };

      await addDoc(collection(this.db, 'search_patterns'), searchData);
    } catch (error) {
      console.error('Error tracking search pattern:', error);
    }
  }

  // SUBSCRIPTION ANALYTICS
  async trackSubscriptionEvent(
    event: 'view_plans' | 'start_trial' | 'subscribe' | 'cancel' | 'upgrade',
    tier?: string,
    metadata?: any
  ): Promise<void> {
    await this.trackUserInteraction('subscription', 'SubscriptionScreen', event, {
      subscriptionTier: tier,
      ...metadata,
    });

    if (['subscribe', 'upgrade'].includes(event) && tier) {
      const tierValues = { basic: 4.99, premium: 9.99, pro: 19.99 };
      await this.trackConversion('subscription_started', tierValues[tier] || 0, 'EUR', {
        tier,
        event,
      });
    }
  }

  // MEMORY SYSTEM ANALYTICS
  async trackMemoryOperation(
    operation: 'enable' | 'disable' | 'clear' | 'export' | 'conversation_recorded',
    metadata?: any
  ): Promise<void> {
    await this.trackUserInteraction('memory_access', 'MemorySystem', operation, {
      memoryOperation: operation,
      ...metadata,
    });
  }

  // ERROR TRACKING
  async trackError(error: Error, context: string, metadata?: any): Promise<void> {
    await this.trackSystemMetric('error_rate', 1, {
      errorMessage: error.message,
      context,
      stack: error.stack,
      ...metadata,
    });

    // Firebase Analytics error
    logEvent(this.analytics, 'exception', {
      description: error.message,
      fatal: false,
      context,
    });
  }

  // PERFORMANCE TRACKING
  async trackPerformance(metric: string, value: number, context?: string): Promise<void> {
    await this.trackSystemMetric('app_performance', value, {
      feature: metric,
      loadTime: value,
      context,
    });
  }

  // USER SESSION TRACKING
  private async trackUserSession(): Promise<void> {
    try {
      const sessionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        startTime: Timestamp.now(),
        platform: await this.getPlatform(),
        appVersion: await this.getAppVersion(),
        deviceInfo: await this.getDeviceInfo(),
      };

      await addDoc(collection(this.db, 'user_sessions'), sessionData);
    } catch (error) {
      console.error('Error tracking user session:', error);
    }
  }

  // BATCH PROCESSING
  private setupBatchProcessing(): void {
    setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.flushBatch();
      }
    }, this.FLUSH_INTERVAL);
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      const promises = batch.map(interaction =>
        addDoc(collection(this.db, 'user_interactions'), {
          ...interaction,
          timestamp: Timestamp.fromDate(interaction.timestamp),
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error flushing analytics batch:', error);
      // Re-add failed items to queue
      this.batchQueue.unshift(...batch);
    }
  }

  // UTILITY METHODS
  private isCriticalEvent(eventType: string): boolean {
    return ['subscription', 'memory_access', 'error'].includes(eventType);
  }

  private async getUserAgent(): Promise<string> {
    return 'GREED-GROSS-Mobile/1.0';
  }

  private async getDeviceInfo(): Promise<UserInteraction['deviceInfo']> {
    try {
      const platform = await this.getPlatform();
      return {
        platform,
        version: await this.getAppVersion(),
      };
    } catch {
      return {
        platform: 'unknown',
        version: '1.0.0',
      };
    }
  }

  private async getLocationInfo(): Promise<UserInteraction['location']> {
    try {
      const { geoLocationService } = await import('./geoLocationService');
      const locationData = await geoLocationService.getLocationForAnalytics();

      return {
        country: locationData.country,
        timezone: locationData.timezone,
      };
    } catch {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  }

  private async getPlatform(): Promise<string> {
    return 'react-native';
  }

  private async getAppVersion(): Promise<string> {
    return '1.0.0';
  }

  // ERROR TRACKING SETUP
  private setupErrorTracking(): void {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0] instanceof Error) {
        this.trackError(args[0], 'console_error');
      }
      originalConsoleError(...args);
    };
  }

  // ANALYTICS SETTINGS
  async updateAnalyticsSettings(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('@greedgross:analytics_enabled', JSON.stringify(enabled));
  }

  async getAnalyticsSettings(): Promise<boolean> {
    try {
      const setting = await AsyncStorage.getItem('@greedgross:analytics_enabled');
      return setting ? JSON.parse(setting) : true;
    } catch {
      return true;
    }
  }

  // PUBLIC ANALYTICS QUERY METHODS
  async getSessionAnalytics(userId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(this.db, 'user_interactions'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const interactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      }));

      return {
        totalInteractions: interactions.length,
        uniqueSessions: [...new Set(interactions.map((i: any) => i.sessionId))].length,
        topActions: this.getTopActions(interactions),
        screenTime: this.calculateScreenTime(interactions),
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      return null;
    }
  }

  private getTopActions(interactions: any[]): { action: string; count: number }[] {
    const actionCounts = {};
    interactions.forEach(i => {
      actionCounts[i.action] = (actionCounts[i.action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateScreenTime(interactions: any[]): Record<string, number> {
    const screenTimes = {};
    interactions.forEach(i => {
      screenTimes[i.screen] = (screenTimes[i.screen] || 0) + 1;
    });
    return screenTimes;
  }
}

export const analyticsCollector = new AnalyticsCollector();
