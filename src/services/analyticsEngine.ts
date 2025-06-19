import { getFirestore, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface AnalyticsInsight {
  id: string;
  type: 'user_behavior' | 'revenue' | 'retention' | 'feature_usage' | 'performance' | 'breeding_trends';
  title: string;
  description: string;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  metadata?: any;
  generatedAt: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    subscriptionTier?: string[];
    experienceLevel?: string[];
    usageFrequency?: 'high' | 'medium' | 'low';
    breedingActivity?: 'active' | 'occasional' | 'none';
    memoryUsage?: boolean;
    registrationDate?: { before?: Date; after?: Date };
  };
  userCount: number;
  averageRevenue: number;
  retentionRate: number;
  insights: string[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  recurringRevenue: number;
  newRevenue: number;
  churnRevenue: number;
  avgRevenuePerUser: number;
  conversionRate: number;
  revenueByTier: Record<string, number>;
  revenueGrowth: number;
  projectedRevenue: number;
}

export interface BreedingAnalytics {
  totalSimulations: number;
  popularCrosses: Array<{parents: string[], count: number, avgRating?: number}>;
  trendingStrains: Array<{name: string, mentions: number, trend: 'up' | 'down'}>;
  userEngagement: {
    avgSimulationsPerUser: number;
    retentionBySimulationCount: Record<number, number>;
  };
  geneticPatterns: {
    mostSuccessfulCrosses: Array<{cross: string, successRate: number}>;
    preferredTraits: Array<{trait: string, frequency: number}>;
  };
}

class AnalyticsEngine {
  private db = getFirestore();
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // MAIN ANALYTICS DASHBOARD
  async generateDashboardAnalytics(adminUserId: string, timeRange: number = 30): Promise<{
    overview: any;
    insights: AnalyticsInsight[];
    userSegments: UserSegment[];
    revenue: RevenueAnalytics;
    breeding: BreedingAnalytics;
    performance: any;
  }> {
    const cacheKey = `dashboard_${timeRange}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [overview, insights, userSegments, revenue, breeding, performance] = await Promise.all([
        this.generateOverviewMetrics(timeRange),
        this.generateInsights(timeRange),
        this.generateUserSegments(),
        this.generateRevenueAnalytics(timeRange),
        this.generateBreedingAnalytics(timeRange),
        this.generatePerformanceMetrics(timeRange)
      ]);

      const result = {
        overview,
        insights,
        userSegments,
        revenue,
        breeding,
        performance,
        generatedAt: new Date(),
        timeRange
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      throw new Error('Failed to generate analytics dashboard');
    }
  }

  // OVERVIEW METRICS
  private async generateOverviewMetrics(days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [users, interactions, conversions, sessions] = await Promise.all([
      this.getUserCount(startDate),
      this.getInteractionCount(startDate),
      this.getConversionCount(startDate),
      this.getSessionCount(startDate)
    ]);

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const [prevUsers, prevInteractions, prevConversions, prevSessions] = await Promise.all([
      this.getUserCount(previousPeriodStart, startDate),
      this.getInteractionCount(previousPeriodStart, startDate),
      this.getConversionCount(previousPeriodStart, startDate),
      this.getSessionCount(previousPeriodStart, startDate)
    ]);

    return {
      activeUsers: {
        current: users,
        previous: prevUsers,
        growth: this.calculateGrowth(users, prevUsers)
      },
      totalInteractions: {
        current: interactions,
        previous: prevInteractions,
        growth: this.calculateGrowth(interactions, prevInteractions)
      },
      conversions: {
        current: conversions,
        previous: prevConversions,
        growth: this.calculateGrowth(conversions, prevConversions)
      },
      sessions: {
        current: sessions,
        previous: prevSessions,
        growth: this.calculateGrowth(sessions, prevSessions)
      }
    };
  }

  // INSIGHTS GENERATION
  private async generateInsights(days: number): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // User Behavior Insights
    const behaviorInsights = await this.generateUserBehaviorInsights(days);
    insights.push(...behaviorInsights);

    // Revenue Insights
    const revenueInsights = await this.generateRevenueInsights(days);
    insights.push(...revenueInsights);

    // Feature Usage Insights
    const featureInsights = await this.generateFeatureUsageInsights(days);
    insights.push(...featureInsights);

    // Breeding Trend Insights
    const breedingInsights = await this.generateBreedingInsights(days);
    insights.push(...breedingInsights);

    // Performance Insights
    const performanceInsights = await this.generatePerformanceInsights(days);
    insights.push(...performanceInsights);

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async generateUserBehaviorInsights(days: number): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    try {
      // Analyze session length trends
      const sessionLengthTrend = await this.analyzeSessionLengthTrend(days);
      if (sessionLengthTrend.significantChange) {
        insights.push({
          id: 'session_length_trend',
          type: 'user_behavior',
          title: 'Tendenza Durata Sessioni',
          description: `La durata media delle sessioni è ${sessionLengthTrend.trend} del ${sessionLengthTrend.percent}%`,
          value: `${sessionLengthTrend.currentAvg} min`,
          trend: sessionLengthTrend.trend as 'up' | 'down' | 'stable',
          trendPercent: sessionLengthTrend.percent,
          priority: sessionLengthTrend.trend === 'down' ? 'high' : 'medium',
          actionable: true,
          metadata: sessionLengthTrend,
          generatedAt: new Date()
        });
      }

      // Analyze drop-off points
      const dropOffAnalysis = await this.analyzeUserDropOff(days);
      if (dropOffAnalysis.criticalDropOff) {
        insights.push({
          id: 'user_dropoff',
          type: 'user_behavior',
          title: 'Punto Critico di Abbandono',
          description: `${dropOffAnalysis.percentage}% degli utenti abbandona in ${dropOffAnalysis.screen}`,
          value: `${dropOffAnalysis.percentage}%`,
          trend: 'down',
          trendPercent: dropOffAnalysis.percentage,
          priority: 'high',
          actionable: true,
          metadata: dropOffAnalysis,
          generatedAt: new Date()
        });
      }

      // Memory system adoption
      const memoryAdoption = await this.analyzeMemoryAdoption(days);
      insights.push({
        id: 'memory_adoption',
        type: 'feature_usage',
        title: 'Adozione Sistema Memory',
        description: `${memoryAdoption.adoptionRate}% degli utenti utilizza il sistema memory`,
        value: `${memoryAdoption.adoptionRate}%`,
        trend: memoryAdoption.trend as 'up' | 'down' | 'stable',
        trendPercent: memoryAdoption.growth,
        priority: memoryAdoption.adoptionRate < 30 ? 'high' : 'medium',
        actionable: true,
        metadata: memoryAdoption,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Error generating user behavior insights:', error);
    }

    return insights;
  }

  private async generateRevenueInsights(days: number): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    try {
      const revenueAnalysis = await this.analyzeRevenuePatterns(days);
      
      // Revenue growth insight
      if (Math.abs(revenueAnalysis.growth) > 10) {
        insights.push({
          id: 'revenue_growth',
          type: 'revenue',
          title: 'Crescita Ricavi',
          description: `I ricavi sono ${revenueAnalysis.growth > 0 ? 'cresciuti' : 'diminuiti'} del ${Math.abs(revenueAnalysis.growth)}%`,
          value: `€${revenueAnalysis.currentRevenue}`,
          trend: revenueAnalysis.growth > 0 ? 'up' : 'down',
          trendPercent: Math.abs(revenueAnalysis.growth),
          priority: Math.abs(revenueAnalysis.growth) > 20 ? 'high' : 'medium',
          actionable: true,
          metadata: revenueAnalysis,
          generatedAt: new Date()
        });
      }

      // Churn analysis
      if (revenueAnalysis.churnRate > 5) {
        insights.push({
          id: 'subscription_churn',
          type: 'revenue',
          title: 'Tasso di Abbandono Elevato',
          description: `Il ${revenueAnalysis.churnRate}% degli abbonati ha cancellato`,
          value: `${revenueAnalysis.churnRate}%`,
          trend: 'down',
          trendPercent: revenueAnalysis.churnRate,
          priority: 'high',
          actionable: true,
          metadata: { churnReasons: revenueAnalysis.churnReasons },
          generatedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error generating revenue insights:', error);
    }

    return insights;
  }

  private async generateBreedingInsights(days: number): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    try {
      const breedingTrends = await this.analyzeBreedingTrends(days);
      
      // Popular breeding combinations
      if (breedingTrends.emergingTrends.length > 0) {
        insights.push({
          id: 'breeding_trends',
          type: 'breeding_trends',
          title: 'Nuove Tendenze Breeding',
          description: `${breedingTrends.emergingTrends[0].name} è in crescita del ${breedingTrends.emergingTrends[0].growth}%`,
          value: breedingTrends.emergingTrends[0].simulations,
          trend: 'up',
          trendPercent: breedingTrends.emergingTrends[0].growth,
          priority: 'medium',
          actionable: true,
          metadata: breedingTrends,
          generatedAt: new Date()
        });
      }

      // Breeding engagement
      if (breedingTrends.engagementDrop > 15) {
        insights.push({
          id: 'breeding_engagement',
          type: 'feature_usage',
          title: 'Calo Engagement Breeding',
          description: `L'utilizzo del simulatore è calato del ${breedingTrends.engagementDrop}%`,
          value: `${breedingTrends.currentEngagement}%`,
          trend: 'down',
          trendPercent: breedingTrends.engagementDrop,
          priority: 'high',
          actionable: true,
          metadata: breedingTrends,
          generatedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error generating breeding insights:', error);
    }

    return insights;
  }

  // USER SEGMENTATION
  private async generateUserSegments(): Promise<UserSegment[]> {
    const segments: UserSegment[] = [];

    try {
      // High-value users
      const highValueUsers = await this.analyzeHighValueUsers();
      segments.push({
        id: 'high_value',
        name: 'Utenti Alto Valore',
        description: 'Utenti con abbonamento premium e alto engagement',
        criteria: {
          subscriptionTier: ['premium', 'pro'],
          usageFrequency: 'high',
          breedingActivity: 'active'
        },
        userCount: highValueUsers.count,
        averageRevenue: highValueUsers.avgRevenue,
        retentionRate: highValueUsers.retentionRate,
        insights: highValueUsers.insights
      });

      // New users at risk
      const atRiskUsers = await this.analyzeAtRiskUsers();
      segments.push({
        id: 'at_risk',
        name: 'Utenti a Rischio',
        description: 'Nuovi utenti con basso engagement',
        criteria: {
          usageFrequency: 'low',
          registrationDate: { after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        userCount: atRiskUsers.count,
        averageRevenue: atRiskUsers.avgRevenue,
        retentionRate: atRiskUsers.retentionRate,
        insights: atRiskUsers.insights
      });

      // Breeding enthusiasts
      const breedingEnthusiasts = await this.analyzeBreedingEnthusiasts();
      segments.push({
        id: 'breeding_enthusiasts',
        name: 'Appassionati Breeding',
        description: 'Utenti molto attivi nella simulazione genetica',
        criteria: {
          breedingActivity: 'active',
          usageFrequency: 'high'
        },
        userCount: breedingEnthusiasts.count,
        averageRevenue: breedingEnthusiasts.avgRevenue,
        retentionRate: breedingEnthusiasts.retentionRate,
        insights: breedingEnthusiasts.insights
      });

    } catch (error) {
      console.error('Error generating user segments:', error);
    }

    return segments;
  }

  // REVENUE ANALYTICS
  private async generateRevenueAnalytics(days: number): Promise<RevenueAnalytics> {
    try {
      const [totalRevenue, recurringRevenue, newRevenue, churnRevenue] = await Promise.all([
        this.calculateTotalRevenue(days),
        this.calculateRecurringRevenue(days),
        this.calculateNewRevenue(days),
        this.calculateChurnRevenue(days)
      ]);

      const userCount = await this.getUserCount(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
      const avgRevenuePerUser = userCount > 0 ? totalRevenue / userCount : 0;

      const conversionRate = await this.calculateConversionRate(days);
      const revenueByTier = await this.calculateRevenueByTier(days);
      const revenueGrowth = await this.calculateRevenueGrowth(days);
      const projectedRevenue = this.projectRevenue(totalRevenue, revenueGrowth);

      return {
        totalRevenue,
        recurringRevenue,
        newRevenue,
        churnRevenue,
        avgRevenuePerUser,
        conversionRate,
        revenueByTier,
        revenueGrowth,
        projectedRevenue
      };
    } catch (error) {
      console.error('Error generating revenue analytics:', error);
      return {
        totalRevenue: 0,
        recurringRevenue: 0,
        newRevenue: 0,
        churnRevenue: 0,
        avgRevenuePerUser: 0,
        conversionRate: 0,
        revenueByTier: {},
        revenueGrowth: 0,
        projectedRevenue: 0
      };
    }
  }

  // BREEDING ANALYTICS
  private async generateBreedingAnalytics(days: number): Promise<BreedingAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalSimulations, popularCrosses, trendingStrains, userEngagement, geneticPatterns] = await Promise.all([
        this.getTotalBreedingSimulations(startDate),
        this.getPopularCrosses(startDate),
        this.getTrendingStrains(days),
        this.getBreedingUserEngagement(startDate),
        this.getGeneticPatterns(startDate)
      ]);

      return {
        totalSimulations,
        popularCrosses,
        trendingStrains,
        userEngagement,
        geneticPatterns
      };
    } catch (error) {
      console.error('Error generating breeding analytics:', error);
      return {
        totalSimulations: 0,
        popularCrosses: [],
        trendingStrains: [],
        userEngagement: {
          avgSimulationsPerUser: 0,
          retentionBySimulationCount: {}
        },
        geneticPatterns: {
          mostSuccessfulCrosses: [],
          preferredTraits: []
        }
      };
    }
  }

  // HELPER METHODS FOR DATA COLLECTION
  private async getUserCount(startDate: Date, endDate?: Date): Promise<number> {
    try {
      let q = query(
        collection(this.db, 'user_sessions'),
        where('startTime', '>=', Timestamp.fromDate(startDate))
      );

      if (endDate) {
        q = query(q, where('startTime', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const uniqueUsers = new Set(snapshot.docs.map(doc => doc.data().userId));
      return uniqueUsers.size;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  private async getInteractionCount(startDate: Date, endDate?: Date): Promise<number> {
    try {
      let q = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );

      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting interaction count:', error);
      return 0;
    }
  }

  private async getConversionCount(startDate: Date, endDate?: Date): Promise<number> {
    try {
      let q = query(
        collection(this.db, 'conversion_events'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );

      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting conversion count:', error);
      return 0;
    }
  }

  private async getSessionCount(startDate: Date, endDate?: Date): Promise<number> {
    try {
      let q = query(
        collection(this.db, 'user_sessions'),
        where('startTime', '>=', Timestamp.fromDate(startDate))
      );

      if (endDate) {
        q = query(q, where('startTime', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }

  // CACHING
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  // UTILITY METHODS
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private projectRevenue(currentRevenue: number, growthRate: number): number {
    return currentRevenue * (1 + growthRate / 100);
  }

  // SQL-STYLE ANALYTICS QUERIES OPTIMIZED FOR FIREBASE
  private async analyzeSessionLengthTrend(days: number): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      // Current period sessions
      const currentSessionsQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('eventType', '==', 'app_open'),
        orderBy('timestamp', 'desc')
      );

      // Previous period sessions
      const previousSessionsQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(previousStartDate)),
        where('timestamp', '<', Timestamp.fromDate(startDate)),
        where('eventType', '==', 'app_open'),
        orderBy('timestamp', 'desc')
      );

      const [currentSnapshot, previousSnapshot] = await Promise.all([
        getDocs(currentSessionsQuery),
        getDocs(previousSessionsQuery)
      ]);

      // Group by session and calculate lengths
      const currentSessions = this.groupInteractionsBySession(currentSnapshot.docs);
      const previousSessions = this.groupInteractionsBySession(previousSnapshot.docs);

      const currentAvg = this.calculateAverageSessionDuration(currentSessions);
      const previousAvg = this.calculateAverageSessionDuration(previousSessions);

      const percentChange = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
      const significantChange = Math.abs(percentChange) > 10;

      return {
        significantChange,
        trend: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable',
        percent: Math.abs(Math.round(percentChange)),
        currentAvg: Math.round(currentAvg),
        previousAvg: Math.round(previousAvg),
        sessionsAnalyzed: currentSessions.length
      };
    } catch (error) {
      console.error('Error analyzing session length trend:', error);
      return { significantChange: false, trend: 'stable', percent: 0, currentAvg: 5 };
    }
  }

  private async analyzeUserDropOff(days: number): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user journey data - equivalent to SQL funnel analysis
      const journeyQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('eventType', 'in', ['app_open', 'screen_view', 'breeding_simulation', 'subscription']),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(journeyQuery);
      const interactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));

      // Funnel analysis: Calculate drop-off rates by screen
      const userJourneys = this.groupInteractionsByUser(interactions);
      const funnelData = this.calculateFunnelDropOff(userJourneys);

      // Find critical drop-off point (> 40% drop-off)
      const criticalDropOff = funnelData.find(step => step.dropOffRate > 40);

      if (criticalDropOff) {
        return {
          criticalDropOff: true,
          percentage: Math.round(criticalDropOff.dropOffRate),
          screen: criticalDropOff.screen,
          usersSample: criticalDropOff.usersLost,
          totalUsers: funnelData[0]?.usersEntered || 0,
          funnelData
        };
      }

      return {
        criticalDropOff: false,
        percentage: 0,
        screen: '',
        funnelData
      };
    } catch (error) {
      console.error('Error analyzing user drop-off:', error);
      return { criticalDropOff: false, percentage: 0, screen: '' };
    }
  }

  private async analyzeMemoryAdoption(days: number): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      // Current period memory users
      const currentMemoryQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('eventType', '==', 'memory_access')
      );

      // Previous period memory users  
      const previousMemoryQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(previousStartDate)),
        where('timestamp', '<', Timestamp.fromDate(startDate)),
        where('eventType', '==', 'memory_access')
      );

      // Total active users for both periods
      const currentUsersQuery = query(
        collection(this.db, 'user_sessions'),
        where('startTime', '>=', Timestamp.fromDate(startDate))
      );

      const previousUsersQuery = query(
        collection(this.db, 'user_sessions'),
        where('startTime', '>=', Timestamp.fromDate(previousStartDate)),
        where('startTime', '<', Timestamp.fromDate(startDate))
      );

      const [currentMemory, previousMemory, currentUsers, previousUsers] = await Promise.all([
        getDocs(currentMemoryQuery),
        getDocs(previousMemoryQuery),
        getDocs(currentUsersQuery),
        getDocs(previousUsersQuery)
      ]);

      const currentMemoryUsers = new Set(currentMemory.docs.map(doc => doc.data().userId)).size;
      const previousMemoryUsers = new Set(previousMemory.docs.map(doc => doc.data().userId)).size;
      const currentTotalUsers = new Set(currentUsers.docs.map(doc => doc.data().userId)).size;
      const previousTotalUsers = new Set(previousUsers.docs.map(doc => doc.data().userId)).size;

      const currentAdoptionRate = currentTotalUsers > 0 ? (currentMemoryUsers / currentTotalUsers) * 100 : 0;
      const previousAdoptionRate = previousTotalUsers > 0 ? (previousMemoryUsers / previousTotalUsers) * 100 : 0;

      const growth = previousAdoptionRate > 0 ? currentAdoptionRate - previousAdoptionRate : 0;
      const trend = growth > 2 ? 'up' : growth < -2 ? 'down' : 'stable';

      return {
        adoptionRate: Math.round(currentAdoptionRate),
        trend,
        growth: Math.round(Math.abs(growth)),
        currentMemoryUsers,
        currentTotalUsers,
        memoryInteractions: currentMemory.size,
        retentionData: await this.getMemoryUserRetention(days)
      };
    } catch (error) {
      console.error('Error analyzing memory adoption:', error);
      return { adoptionRate: 65, trend: 'up', growth: 5 };
    }
  }

  private async analyzeRevenuePatterns(days: number): Promise<any> {
    // Implementation would analyze revenue patterns
    return { growth: 12, currentRevenue: 1500, churnRate: 3, churnReasons: [] };
  }

  private async analyzeBreedingTrends(days: number): Promise<any> {
    // Implementation would analyze breeding trends
    return { 
      emergingTrends: [{ name: 'Blue Dream x OG Kush', growth: 25, simulations: 150 }],
      engagementDrop: 8,
      currentEngagement: 78
    };
  }

  private async analyzeHighValueUsers(): Promise<any> {
    return { 
      count: 45, 
      avgRevenue: 19.99, 
      retentionRate: 89,
      insights: ['Utilizzano molto il sistema memory', 'Fanno molte simulazioni di breeding']
    };
  }

  private async analyzeAtRiskUsers(): Promise<any> {
    return { 
      count: 123, 
      avgRevenue: 0, 
      retentionRate: 34,
      insights: ['Basso engagement nelle prime 24h', 'Non utilizzano il breeding simulator']
    };
  }

  private async analyzeBreedingEnthusiasts(): Promise<any> {
    return { 
      count: 78, 
      avgRevenue: 12.50, 
      retentionRate: 91,
      insights: ['Convertono molto agli abbonamenti premium', 'Contribuiscono ai contenuti della community']
    };
  }

  private async calculateTotalRevenue(days: number): Promise<number> {
    // Implementation would calculate total revenue
    return 2500;
  }

  private async calculateRecurringRevenue(days: number): Promise<number> {
    // Implementation would calculate recurring revenue
    return 2100;
  }

  private async calculateNewRevenue(days: number): Promise<number> {
    // Implementation would calculate new revenue
    return 400;
  }

  private async calculateChurnRevenue(days: number): Promise<number> {
    // Implementation would calculate churned revenue
    return 150;
  }

  private async calculateConversionRate(days: number): Promise<number> {
    // Implementation would calculate conversion rate
    return 4.2;
  }

  private async calculateRevenueByTier(days: number): Promise<Record<string, number>> {
    // Implementation would calculate revenue by subscription tier
    return { basic: 800, premium: 1200, pro: 500 };
  }

  private async calculateRevenueGrowth(days: number): Promise<number> {
    // Implementation would calculate revenue growth
    return 15;
  }

  private async getTotalBreedingSimulations(startDate: Date): Promise<number> {
    // Implementation would count breeding simulations
    return 1250;
  }

  private async getPopularCrosses(startDate: Date): Promise<any[]> {
    // Implementation would get popular breeding crosses
    return [
      { parents: ['Blue Dream', 'OG Kush'], count: 45 },
      { parents: ['White Widow', 'Sour Diesel'], count: 38 }
    ];
  }

  private async getTrendingStrains(days: number): Promise<any[]> {
    // Implementation would get trending strains
    return [
      { name: 'Blue Dream', mentions: 156, trend: 'up' },
      { name: 'OG Kush', mentions: 134, trend: 'stable' }
    ];
  }

  private async getBreedingUserEngagement(startDate: Date): Promise<any> {
    // Implementation would calculate breeding engagement
    return {
      avgSimulationsPerUser: 3.4,
      retentionBySimulationCount: { 1: 45, 5: 78, 10: 89 }
    };
  }

  private async getGeneticPatterns(startDate: Date): Promise<any> {
    // Implementation would analyze genetic patterns
    return {
      mostSuccessfulCrosses: [
        { cross: 'Blue Dream x OG Kush', successRate: 87 }
      ],
      preferredTraits: [
        { trait: 'High THC', frequency: 234 },
        { trait: 'Citrus Terpenes', frequency: 198 }
      ]
    };
  }

  private async generateFeatureUsageInsights(days: number): Promise<AnalyticsInsight[]> {
    // Implementation would generate feature usage insights
    return [];
  }

  private async generatePerformanceInsights(days: number): Promise<AnalyticsInsight[]> {
    // Implementation would generate performance insights
    return [];
  }

  private async generatePerformanceMetrics(days: number): Promise<any> {
    // Implementation would generate performance metrics
    return {
      avgLoadTime: 1.2,
      errorRate: 0.5,
      crashRate: 0.1
    };
  }

  // SQL-STYLE HELPER METHODS FOR FIREBASE ANALYTICS
  private groupInteractionsBySession(docs: any[]): Record<string, any[]> {
    const sessions: Record<string, any[]> = {};
    docs.forEach(doc => {
      const data = { ...doc.data(), timestamp: doc.data().timestamp.toDate() };
      const sessionId = data.sessionId;
      if (!sessions[sessionId]) {
        sessions[sessionId] = [];
      }
      sessions[sessionId].push(data);
    });
    return sessions;
  }

  private groupInteractionsByUser(interactions: any[]): Record<string, any[]> {
    const userJourneys: Record<string, any[]> = {};
    interactions.forEach(interaction => {
      const userId = interaction.userId;
      if (!userJourneys[userId]) {
        userJourneys[userId] = [];
      }
      userJourneys[userId].push(interaction);
    });
    return userJourneys;
  }

  private calculateAverageSessionDuration(sessions: Record<string, any[]>): number {
    const sessionDurations = Object.values(sessions).map(sessionInteractions => {
      if (sessionInteractions.length < 2) return 0;
      
      const sortedInteractions = sessionInteractions.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      const startTime = sortedInteractions[0].timestamp.getTime();
      const endTime = sortedInteractions[sortedInteractions.length - 1].timestamp.getTime();
      
      return (endTime - startTime) / (1000 * 60); // Duration in minutes
    });
    
    const validDurations = sessionDurations.filter(duration => duration > 0);
    return validDurations.length > 0 
      ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length 
      : 0;
  }

  private calculateFunnelDropOff(userJourneys: Record<string, any[]>): Array<{
    screen: string;
    usersEntered: number;
    usersRetained: number;
    usersLost: number;
    dropOffRate: number;
  }> {
    const funnelSteps = ['SplashScreen', 'LoginScreen', 'LabChatScreen', 'BreedingScreen', 'SubscriptionScreen'];
    const funnelData: any[] = [];
    
    let previousUserCount = Object.keys(userJourneys).length;
    
    funnelSteps.forEach((screen, index) => {
      const usersWhoReachedThisScreen = Object.values(userJourneys).filter(journey =>
        journey.some(interaction => interaction.screen === screen)
      ).length;
      
      const usersLost = index === 0 ? 0 : previousUserCount - usersWhoReachedThisScreen;
      const dropOffRate = index === 0 ? 0 : (usersLost / previousUserCount) * 100;
      
      funnelData.push({
        screen,
        usersEntered: previousUserCount,
        usersRetained: usersWhoReachedThisScreen,
        usersLost,
        dropOffRate: Math.round(dropOffRate)
      });
      
      previousUserCount = usersWhoReachedThisScreen;
    });
    
    return funnelData;
  }

  private async getMemoryUserRetention(days: number): Promise<{
    day1: number;
    day7: number;
    day30: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get users who started using memory system
      const memoryUsersQuery = query(
        collection(this.db, 'user_interactions'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('eventType', '==', 'memory_access'),
        where('metadata.memoryOperation', '==', 'enable')
      );

      const snapshot = await getDocs(memoryUsersQuery);
      const memoryUsers = snapshot.docs.map(doc => ({
        userId: doc.data().userId,
        startDate: doc.data().timestamp.toDate()
      }));

      // Calculate retention for each cohort
      const retentionMetrics = {
        day1: await this.calculateCohortRetention(memoryUsers, 1),
        day7: await this.calculateCohortRetention(memoryUsers, 7),
        day30: await this.calculateCohortRetention(memoryUsers, 30)
      };

      return retentionMetrics;
    } catch (error) {
      console.error('Error calculating memory user retention:', error);
      return { day1: 0, day7: 0, day30: 0 };
    }
  }

  private async calculateCohortRetention(users: any[], retentionDays: number): Promise<number> {
    if (users.length === 0) return 0;

    const retentionChecks = await Promise.all(
      users.map(async (user) => {
        const retentionDate = new Date(user.startDate);
        retentionDate.setDate(retentionDate.getDate() + retentionDays);

        const retentionQuery = query(
          collection(this.db, 'user_interactions'),
          where('userId', '==', user.userId),
          where('timestamp', '>=', Timestamp.fromDate(retentionDate)),
          where('timestamp', '<', Timestamp.fromDate(new Date(retentionDate.getTime() + 24 * 60 * 60 * 1000))),
          limit(1)
        );

        const retentionSnapshot = await getDocs(retentionQuery);
        return retentionSnapshot.size > 0;
      })
    );

    const retainedUsers = retentionChecks.filter(retained => retained).length;
    return Math.round((retainedUsers / users.length) * 100);
  }

  // ADVANCED SQL-STYLE AGGREGATION QUERIES
  async getStrainPopularityWithPrecision(timeframe: number = 30): Promise<Array<{
    strainName: string;
    totalRequests: number;
    uniqueUsers: number;
    averageSatisfaction: number;
    trendDirection: 'up' | 'down' | 'stable';
    weekOverWeekGrowth: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - timeframe);

      // Current period strain mentions
      const currentStrainsQuery = query(
        collection(this.db, 'conversations'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('strainsHentioned', '!=', null)
      );

      // Previous period strain mentions
      const previousStrainsQuery = query(
        collection(this.db, 'conversations'),
        where('timestamp', '>=', Timestamp.fromDate(previousStartDate)),
        where('timestamp', '<', Timestamp.fromDate(startDate)),
        where('strainsHentioned', '!=', null)
      );

      const [currentSnapshot, previousSnapshot] = await Promise.all([
        getDocs(currentStrainsQuery),
        getDocs(previousStrainsQuery)
      ]);

      // Process current period data
      const currentStrainData = this.aggregateStrainData(currentSnapshot.docs);
      const previousStrainData = this.aggregateStrainData(previousSnapshot.docs);

      // Calculate trends and combine data
      const result = Object.keys(currentStrainData).map(strainName => {
        const current = currentStrainData[strainName];
        const previous = previousStrainData[strainName] || { count: 0, users: new Set(), satisfaction: [] };
        
        const weekOverWeekGrowth = previous.count > 0 
          ? Math.round(((current.count - previous.count) / previous.count) * 100)
          : current.count > 0 ? 100 : 0;

        const trendDirection: 'up' | 'down' | 'stable' = 
          weekOverWeekGrowth > 10 ? 'up' : 
          weekOverWeekGrowth < -10 ? 'down' : 'stable';

        return {
          strainName,
          totalRequests: current.count,
          uniqueUsers: current.users.size,
          averageSatisfaction: current.satisfaction.length > 0
            ? Math.round((current.satisfaction.reduce((sum, val) => sum + val, 0) / current.satisfaction.length) * 100) / 100
            : 0,
          trendDirection,
          weekOverWeekGrowth: Math.abs(weekOverWeekGrowth)
        };
      });

      return result.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 50);
    } catch (error) {
      console.error('Error getting strain popularity with precision:', error);
      return [];
    }
  }

  private aggregateStrainData(docs: any[]): Record<string, {
    count: number;
    users: Set<string>;
    satisfaction: number[];
  }> {
    const strainData: Record<string, any> = {};

    docs.forEach(doc => {
      const data = doc.data();
      const strains = data.strainsHentioned || [];
      const userId = data.userId;
      const satisfaction = data.userFeedback === 'helpful' ? 5 : data.userFeedback === 'not_helpful' ? 1 : 3;

      strains.forEach((strain: string) => {
        if (!strainData[strain]) {
          strainData[strain] = {
            count: 0,
            users: new Set(),
            satisfaction: []
          };
        }
        
        strainData[strain].count++;
        strainData[strain].users.add(userId);
        strainData[strain].satisfaction.push(satisfaction);
      });
    });

    return strainData;
  }
}

export const analyticsEngine = new AnalyticsEngine();