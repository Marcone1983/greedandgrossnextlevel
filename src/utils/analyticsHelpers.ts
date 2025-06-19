import { analyticsCollector, UserInteraction } from '@/services/analyticsCollector';

/**
 * Analytics Helper Functions
 * Provides convenient methods for common analytics tracking scenarios
 */

// Screen transition tracking
export const trackScreenTransition = async (
  fromScreen: string,
  toScreen: string,
  navigationMethod: 'push' | 'replace' | 'goBack' | 'reset' = 'push'
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    toScreen,
    'screen_transition',
    {
      fromScreen
    }
  );
};

// User onboarding tracking
export const trackOnboardingStep = async (
  step: number,
  stepName: string,
  completed: boolean,
  timeSpent?: number
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    'OnboardingScreen',
    completed ? 'onboarding_step_completed' : 'onboarding_step_viewed',
    {
      metadata: {
        step: step.toString(),
        completed,
        timeSpent,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Feature discovery tracking
export const trackFeatureDiscovery = async (
  featureName: string,
  discoveryMethod: 'tutorial' | 'exploration' | 'notification' | 'search',
  firstTime: boolean = false
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    'FeatureDiscovery',
    'feature_discovered',
    {
      metadata: {
        featureName,
        discoveryMethod,
        firstTime,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// User engagement tracking
export const trackUserEngagement = async (
  sessionDuration: number,
  screenTime: Record<string, number>,
  interactionCount: number
) => {
  await analyticsCollector.trackSystemMetric(
    'user_retention',
    sessionDuration,
    {
      screenTime,
      interactionCount,
      engagementScore: calculateEngagementScore(sessionDuration, interactionCount),
      timestamp: new Date().toISOString()
    } as any
  );
};

// Calculate engagement score
const calculateEngagementScore = (sessionDuration: number, interactionCount: number): number => {
  // Simple engagement scoring algorithm
  const timeScore = Math.min(sessionDuration / 1000 / 60, 10); // Max 10 for 10+ minutes
  const interactionScore = Math.min(interactionCount, 20); // Max 20 for 20+ interactions
  return Math.round((timeScore + interactionScore) / 2);
};

// Strain interaction tracking
export const trackStrainInteraction = async (
  strainName: string,
  interactionType: 'view' | 'favorite' | 'share' | 'compare' | 'cross',
  metadata?: any
) => {
  await analyticsCollector.trackUserInteraction(
    'strain_view',
    'StrainDetailScreen',
    `strain_${interactionType}`,
    {
      strainName,
      metadata: {
        interactionType,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Breeding simulation tracking with detailed metrics
export const trackDetailedBreedingSimulation = async (
  parent1: string,
  parent2: string,
  result: any,
  simulationMetrics: {
    duration: number;
    complexity: 'simple' | 'medium' | 'complex';
    userExperience: 'beginner' | 'intermediate' | 'expert';
    satisfaction?: number; // 1-5 rating
  }
) => {
  await analyticsCollector.trackBreedingSimulation(parent1, parent2, result);
  
  await analyticsCollector.trackUserInteraction(
    'breeding_simulation',
    'BreedingScreen',
    'detailed_simulation',
    {
      simulationResult: {
        parents: [parent1, parent2],
        result: result.name,
        ...simulationMetrics,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Search behavior tracking
export const trackSearchBehavior = async (
  query: string,
  results: any[],
  userBehavior: {
    resultClicked?: boolean;
    clickedIndex?: number;
    refinedSearch?: boolean;
    appliedFilters?: string[];
    timeToClick?: number;
  }
) => {
  await analyticsCollector.trackSearch(query, results, 'SearchScreen');
  
  await analyticsCollector.trackUserInteraction(
    'search',
    'SearchScreen',
    'search_behavior',
    {
      searchQuery: query,
      metadata: {
        resultCount: results.length,
        ...userBehavior,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Tutorial completion tracking
export const trackTutorialProgress = async (
  tutorialName: string,
  currentStep: number,
  totalSteps: number,
  completed: boolean,
  skipped: boolean = false
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    'TutorialScreen',
    completed ? 'tutorial_completed' : skipped ? 'tutorial_skipped' : 'tutorial_progress',
    {
      metadata: {
        tutorialName,
        currentStep,
        totalSteps,
        progress: (currentStep / totalSteps) * 100,
        completed,
        skipped,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Social sharing tracking
export const trackSocialSharing = async (
  contentType: 'strain' | 'simulation' | 'article' | 'app',
  contentId: string,
  platform: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'twitter' | 'copy_link',
  success: boolean
) => {
  await analyticsCollector.trackUserInteraction(
    'share',
    'SocialShare',
    success ? 'share_success' : 'share_failed',
    {
      metadata: {
        contentType,
        contentId,
        platform,
        success,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Settings change tracking
export const trackSettingsChange = async (
  setting: string,
  oldValue: any,
  newValue: any,
  screen: string = 'SettingsScreen'
) => {
  await analyticsCollector.trackUserInteraction(
    'settings_change',
    screen,
    'setting_modified',
    {
      settingsChanged: [setting],
      metadata: {
        oldValue,
        newValue,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Error tracking with context
export const trackDetailedError = async (
  error: Error,
  context: {
    screen: string;
    action: string;
    userAgent?: string;
    appVersion?: string;
    userId?: string;
  }
) => {
  await analyticsCollector.trackError(error, context.screen, {
    action: context.action,
    userAgent: context.userAgent,
    appVersion: context.appVersion,
    userId: context.userId,
    errorStack: error.stack,
    timestamp: new Date().toISOString()
  } as any);
};

// A/B test tracking
export const trackABTest = async (
  testName: string,
  variant: string,
  action: 'view' | 'interact' | 'convert',
  metadata?: any
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    'ABTest',
    `ab_test_${action}`,
    {
      metadata: {
        testName,
        variant,
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Push notification tracking
export const trackPushNotification = async (
  notificationId: string,
  action: 'received' | 'opened' | 'dismissed' | 'action_clicked',
  notificationType: 'promotional' | 'educational' | 'system' | 'breeding_tip',
  metadata?: any
) => {
  await analyticsCollector.trackUserInteraction(
    'app_open',
    'PushNotification',
    `notification_${action}`,
    {
      metadata: {
        notificationId,
        notificationType,
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Performance timing helpers
export class PerformanceTracker {
  private startTimes: Map<string, number> = new Map();

  startTiming(operation: string): void {
    this.startTimes.set(operation, Date.now());
  }

  async endTiming(operation: string, context?: string): Promise<number> {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operation);

    await analyticsCollector.trackPerformance(operation, duration, context);
    return duration;
  }

  async trackAsyncOperation<T>(
    operation: string,
    asyncFunction: () => Promise<T>,
    context?: string
  ): Promise<T> {
    this.startTiming(operation);
    try {
      const result = await asyncFunction();
      await this.endTiming(operation, context);
      return result;
    } catch (error) {
      await this.endTiming(operation, context);
      throw error;
    }
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

// Conversion funnel tracking
export const trackConversionFunnel = async (
  funnelName: string,
  step: string,
  stepNumber: number,
  totalSteps: number,
  completed: boolean = false,
  metadata?: any
) => {
  await analyticsCollector.trackUserInteraction(
    'subscription',
    'ConversionFunnel',
    completed ? 'funnel_completed' : 'funnel_step',
    {
      metadata: {
        funnelName,
        step,
        stepNumber,
        totalSteps,
        progress: (stepNumber / totalSteps) * 100,
        completed,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// User retention tracking
export const trackUserRetention = async (
  daysSinceInstall: number,
  daysSinceLastUse: number,
  sessionNumber: number,
  returningUser: boolean
) => {
  await analyticsCollector.trackSystemMetric(
    'user_retention',
    daysSinceInstall,
    {
      daysSinceLastUse,
      metadata: {
        sessionNumber,
        returningUser,
        retentionCohort: getRetentionCohort(daysSinceInstall),
        timestamp: new Date().toISOString()
      }
    } as any
  );
};

// Helper function to determine retention cohort
const getRetentionCohort = (daysSinceInstall: number): string => {
  if (daysSinceInstall <= 1) return 'day_1';
  if (daysSinceInstall <= 7) return 'week_1';
  if (daysSinceInstall <= 30) return 'month_1';
  if (daysSinceInstall <= 90) return 'quarter_1';
  return 'long_term';
};

// Batch analytics operations for better performance
export class AnalyticsBatcher {
  private batch: Array<() => Promise<void>> = [];
  private batchTimeout: any = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  add(analyticsFunction: () => Promise<void>): void {
    this.batch.push(analyticsFunction);

    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), this.BATCH_TIMEOUT);
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      await Promise.all(currentBatch.map(fn => fn()));
    } catch (error) {
      console.error('Error flushing analytics batch:', error);
    }
  }
}

// Global analytics batcher instance
export const analyticsBatcher = new AnalyticsBatcher();

// Auto-flush on app state changes (React Native compatible)
try {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeunload', () => {
      analyticsBatcher.flush();
    });
  }
} catch (error) {
  // Handle React Native environment where window might not be available
  // Window not available, skipping beforeunload listener
}

// React Native app state handler would go here
// This would need to be set up in the main App component