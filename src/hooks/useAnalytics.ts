import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { analyticsCollector } from '@/services/analyticsCollector';
import { useNavigation } from '@react-navigation/native';

interface UseAnalyticsOptions {
  trackScreenViews?: boolean;
  trackUserInteractions?: boolean;
  trackErrors?: boolean;
  enableMemoryTracking?: boolean;
}

interface UseAnalyticsReturn {
  trackEvent: (eventType: string, screen: string, action: string, metadata?: any) => Promise<void>;
  trackScreen: (screenName: string, metadata?: any) => Promise<void>;
  trackBreeding: (parent1: string, parent2: string, result: any) => Promise<void>;
  trackSearch: (query: string, results: any[], screen: string) => Promise<void>;
  trackSubscription: (event: string, tier?: string, metadata?: any) => Promise<void>;
  trackError: (error: Error, context: string, metadata?: any) => Promise<void>;
  trackPerformance: (metric: string, value: number, context?: string) => Promise<void>;
  trackMemory: (operation: string, metadata?: any) => Promise<void>;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    trackScreenViews = true,
    trackUserInteractions = true,
    trackErrors = true,
    enableMemoryTracking = true,
  } = options;

  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation();

  // Initialize analytics when user is available
  useEffect(() => {
    if (user?.id) {
      analyticsCollector.initialize(user.id);
    }
  }, [user?.id]);

  // Track screen views automatically
  useEffect(() => {
    if (!trackScreenViews || !user?.id) return;

    const unsubscribe = navigation.addListener('state', e => {
      const route = navigation.getCurrentRoute();
      if (route) {
        trackScreen(route.name);
      }
    });

    return unsubscribe;
  }, [navigation, trackScreenViews, user?.id]);

  // Track general events
  const trackEvent = useCallback(
    async (eventType: string, screen: string, action: string, metadata?: any) => {
      if (!trackUserInteractions) return;

      try {
        await analyticsCollector.trackUserInteraction(eventType as any, screen, action, metadata);
      } catch (error) {
        // Error tracking event
      }
    },
    [trackUserInteractions]
  );

  // Track screen views
  const trackScreen = useCallback(
    async (screenName: string, metadata?: any) => {
      await trackEvent('app_open', screenName, 'screen_view', {
        ...metadata,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent]
  );

  // Track breeding simulations
  const trackBreeding = useCallback(
    async (parent1: string, parent2: string, result: any) => {
      try {
        await analyticsCollector.trackBreedingSimulation(parent1, parent2, result, user?.id);
      } catch (error) {
        // Error tracking breeding simulation
      }
    },
    [user?.id]
  );

  // Track search activities
  const trackSearch = useCallback(async (query: string, results: any[], screen: string) => {
    try {
      await analyticsCollector.trackSearch(query, results, screen);
    } catch (error) {
      // Error tracking search
    }
  }, []);

  // Track subscription events
  const trackSubscription = useCallback(async (event: string, tier?: string, metadata?: any) => {
    try {
      await analyticsCollector.trackSubscriptionEvent(event as any, tier, metadata);
    } catch (error) {
      // Error tracking subscription event
    }
  }, []);

  // Track errors
  const trackError = useCallback(
    async (error: Error, context: string, metadata?: any) => {
      if (!trackErrors) return;

      try {
        await analyticsCollector.trackError(error, context, metadata);
      } catch (err) {
        // Error tracking error
      }
    },
    [trackErrors]
  );

  // Track performance metrics
  const trackPerformance = useCallback(async (metric: string, value: number, context?: string) => {
    try {
      await analyticsCollector.trackPerformance(metric, value, context);
    } catch (error) {
      // Error tracking performance
    }
  }, []);

  // Track memory system operations
  const trackMemory = useCallback(
    async (operation: string, metadata?: any) => {
      if (!enableMemoryTracking) return;

      try {
        await analyticsCollector.trackMemoryOperation(operation as any, metadata);
      } catch (error) {
        // Error tracking memory operation
      }
    },
    [enableMemoryTracking]
  );

  return {
    trackEvent,
    trackScreen,
    trackBreeding,
    trackSearch,
    trackSubscription,
    trackError,
    trackPerformance,
    trackMemory,
  };
}

// Higher-order component for automatic screen tracking
export function withAnalytics<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  screenName: string,
  options: UseAnalyticsOptions = {}
) {
  return function AnalyticsWrapper(props: T) {
    const analytics = useAnalytics(options);

    useEffect(() => {
      analytics.trackScreen(screenName);
    }, [analytics]);

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for breeding screen specific analytics
export function useBreedingAnalytics() {
  const analytics = useAnalytics();

  const trackSimulationStart = useCallback(
    (parent1: string, parent2: string) => {
      analytics.trackEvent('breeding_simulation', 'BreedingScreen', 'simulation_start', {
        parents: [parent1, parent2],
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSimulationComplete = useCallback(
    (parent1: string, parent2: string, result: any, duration: number) => {
      analytics.trackBreeding(parent1, parent2, result);
      analytics.trackEvent('breeding_simulation', 'BreedingScreen', 'simulation_complete', {
        parents: [parent1, parent2],
        result: result.name,
        duration,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSimulationError = useCallback(
    (parent1: string, parent2: string, error: Error) => {
      analytics.trackError(error, 'breeding_simulation', {
        parents: [parent1, parent2],
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackStrainView = useCallback(
    (strainName: string, source: string) => {
      analytics.trackEvent('strain_view', 'BreedingScreen', 'strain_view', {
        strainName,
        source,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackFavoriteStrain = useCallback(
    (strainName: string, action: 'add' | 'remove') => {
      analytics.trackEvent('strain_view', 'BreedingScreen', `favorite_${action}`, {
        strainName,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  return {
    trackSimulationStart,
    trackSimulationComplete,
    trackSimulationError,
    trackStrainView,
    trackFavoriteStrain,
  };
}

// Hook for search analytics
export function useSearchAnalytics() {
  const analytics = useAnalytics();

  const trackSearchQuery = useCallback(
    (query: string, results: any[], screen: string, filters?: any) => {
      analytics.trackSearch(query, results, screen);
      analytics.trackEvent('search', screen, 'search_performed', {
        query,
        resultCount: results.length,
        hasResults: results.length > 0,
        filters,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSearchResult = useCallback(
    (query: string, selectedResult: any, resultIndex: number, screen: string) => {
      analytics.trackEvent('search', screen, 'search_result_selected', {
        query,
        selectedResult: selectedResult.name || selectedResult.id,
        resultIndex,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSearchFilter = useCallback(
    (filterType: string, filterValue: any, screen: string) => {
      analytics.trackEvent('search', screen, 'search_filter_applied', {
        filterType,
        filterValue,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  return {
    trackSearchQuery,
    trackSearchResult,
    trackSearchFilter,
  };
}

// Hook for subscription analytics
export function useSubscriptionAnalytics() {
  const analytics = useAnalytics();

  const trackSubscriptionView = useCallback(
    (source: string) => {
      analytics.trackSubscription('view_plans', undefined, {
        source,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackTrialStart = useCallback(
    (tier: string) => {
      analytics.trackSubscription('start_trial', tier, {
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSubscriptionPurchase = useCallback(
    (tier: string, price: number, currency: string = 'EUR') => {
      analytics.trackSubscription('subscribe', tier, {
        price,
        currency,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSubscriptionCancel = useCallback(
    (tier: string, reason?: string) => {
      analytics.trackSubscription('cancel', tier, {
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackSubscriptionUpgrade = useCallback(
    (fromTier: string, toTier: string) => {
      analytics.trackSubscription('upgrade', toTier, {
        fromTier,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  return {
    trackSubscriptionView,
    trackTrialStart,
    trackSubscriptionPurchase,
    trackSubscriptionCancel,
    trackSubscriptionUpgrade,
  };
}

// Hook for memory system analytics
export function useMemoryAnalytics() {
  const analytics = useAnalytics({ enableMemoryTracking: true });

  const trackMemoryEnabled = useCallback(() => {
    analytics.trackMemory('enable', {
      timestamp: new Date().toISOString(),
    });
  }, [analytics]);

  const trackMemoryDisabled = useCallback(() => {
    analytics.trackMemory('disable', {
      timestamp: new Date().toISOString(),
    });
  }, [analytics]);

  const trackMemoryCleared = useCallback(
    (reason: string) => {
      analytics.trackMemory('clear', {
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  const trackMemoryExported = useCallback(() => {
    analytics.trackMemory('export', {
      timestamp: new Date().toISOString(),
    });
  }, [analytics]);

  const trackConversationRecorded = useCallback(
    (conversationType: string, responseLength: number) => {
      analytics.trackMemory('conversation_recorded', {
        conversationType,
        responseLength,
        timestamp: new Date().toISOString(),
      });
    },
    [analytics]
  );

  return {
    trackMemoryEnabled,
    trackMemoryDisabled,
    trackMemoryCleared,
    trackMemoryExported,
    trackConversationRecorded,
  };
}
