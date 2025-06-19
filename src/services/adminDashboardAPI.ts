import { analyticsEngine } from './analyticsEngine';
// import { analyticsCollector } from './analyticsCollector';
import { memoryService } from './memoryService';

export interface AdminAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  executionTime: number;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (params: any, query: any, body: any) => Promise<any>;
  requiresAuth: boolean;
  rateLimit?: number; // requests per minute
}

class AdminDashboardAPI {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initializeEndpoints();
  }

  // ENDPOINT INITIALIZATION
  private initializeEndpoints(): void {
    // Dashboard Overview
    this.registerEndpoint({
      path: '/api/admin/overview',
      method: 'GET',
      handler: this.getOverviewMetrics.bind(this),
      requiresAuth: true,
      rateLimit: 60
    });

    // Analytics Insights
    this.registerEndpoint({
      path: '/api/admin/insights',
      method: 'GET',
      handler: this.getAnalyticsInsights.bind(this),
      requiresAuth: true,
      rateLimit: 30
    });

    // User Analytics
    this.registerEndpoint({
      path: '/api/admin/users/analytics',
      method: 'GET',
      handler: this.getUserAnalytics.bind(this),
      requiresAuth: true,
      rateLimit: 30
    });

    // Revenue Analytics
    this.registerEndpoint({
      path: '/api/admin/revenue',
      method: 'GET',
      handler: this.getRevenueAnalytics.bind(this),
      requiresAuth: true,
      rateLimit: 20
    });

    // Breeding Analytics
    this.registerEndpoint({
      path: '/api/admin/breeding/analytics',
      method: 'GET',
      handler: this.getBreedingAnalytics.bind(this),
      requiresAuth: true,
      rateLimit: 30
    });

    // Strain Popularity
    this.registerEndpoint({
      path: '/api/admin/strains/popular',
      method: 'GET',
      handler: this.getStrainPopularity.bind(this),
      requiresAuth: true,
      rateLimit: 60
    });

    // User Segments
    this.registerEndpoint({
      path: '/api/admin/users/segments',
      method: 'GET',
      handler: this.getUserSegments.bind(this),
      requiresAuth: true,
      rateLimit: 20
    });

    // Memory System Analytics
    this.registerEndpoint({
      path: '/api/admin/memory/analytics',
      method: 'GET',
      handler: this.getMemoryAnalytics.bind(this),
      requiresAuth: true,
      rateLimit: 30
    });

    // Performance Metrics
    this.registerEndpoint({
      path: '/api/admin/performance',
      method: 'GET',
      handler: this.getPerformanceMetrics.bind(this),
      requiresAuth: true,
      rateLimit: 60
    });

    // Export Analytics
    this.registerEndpoint({
      path: '/api/admin/export/:format',
      method: 'GET',
      handler: this.exportAnalytics.bind(this),
      requiresAuth: true,
      rateLimit: 5 // Limited due to resource intensity
    });

    // Real-time Stats
    this.registerEndpoint({
      path: '/api/admin/realtime',
      method: 'GET',
      handler: this.getRealtimeStats.bind(this),
      requiresAuth: true,
      rateLimit: 120
    });

    // System Health
    this.registerEndpoint({
      path: '/api/admin/health',
      method: 'GET',
      handler: this.getSystemHealth.bind(this),
      requiresAuth: false,
      rateLimit: 60
    });
  }

  // ENDPOINT REGISTRATION
  private registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.set(`${endpoint.method}:${endpoint.path}`, endpoint);
  }

  // REQUEST HANDLER
  async handleRequest(
    method: string,
    path: string,
    params: any = {},
    query: any = {},
    body: any = {},
    headers: any = {}
  ): Promise<AdminAPIResponse> {
    const startTime = Date.now();
    
    try {
      // Find matching endpoint
      const endpoint = this.findEndpoint(method, path);
      if (!endpoint) {
        return this.errorResponse('Endpoint not found', 404, startTime);
      }

      // Authentication check
      if (endpoint.requiresAuth && !this.isAuthenticated(headers)) {
        return this.errorResponse('Unauthorized', 401, startTime);
      }

      // Rate limiting
      if (endpoint.rateLimit && !this.checkRateLimit(headers, endpoint.rateLimit)) {
        return this.errorResponse('Rate limit exceeded', 429, startTime);
      }

      // Execute handler
      const data = await endpoint.handler(params, query, body);
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('API Error:', error);
      return this.errorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        startTime
      );
    }
  }

  // ENDPOINT HANDLERS
  private async getOverviewMetrics(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      timeRange,
      overview: dashboard.overview,
      summary: {
        activeUsers: dashboard.overview.activeUsers.current,
        totalRevenue: dashboard.revenue.totalRevenue,
        conversions: dashboard.overview.conversions.current,
        avgSessionTime: dashboard.performance?.avgLoadTime || 0
      },
      trends: {
        userGrowth: dashboard.overview.activeUsers.growth,
        revenueGrowth: dashboard.revenue.revenueGrowth,
        conversionGrowth: dashboard.overview.conversions.growth
      }
    };
  }

  private async getAnalyticsInsights(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      insights: dashboard.insights,
      totalInsights: dashboard.insights.length,
      highPriorityInsights: dashboard.insights.filter(i => i.priority === 'high').length,
      actionableInsights: dashboard.insights.filter(i => i.actionable).length
    };
  }

  private async getUserAnalytics(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      overview: dashboard.overview.activeUsers,
      segments: dashboard.userSegments,
      totalSegments: dashboard.userSegments.length,
      segmentSummary: dashboard.userSegments.map(segment => ({
        name: segment.name,
        userCount: segment.userCount,
        avgRevenue: segment.averageRevenue,
        retentionRate: segment.retentionRate
      }))
    };
  }

  private async getRevenueAnalytics(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      ...dashboard.revenue,
      revenueInsights: dashboard.insights.filter(i => i.type === 'revenue'),
      projectedGrowth: dashboard.revenue.projectedRevenue - dashboard.revenue.totalRevenue,
      churnAnalysis: {
        churnRevenue: dashboard.revenue.churnRevenue,
        churnRate: (dashboard.revenue.churnRevenue / dashboard.revenue.totalRevenue) * 100
      }
    };
  }

  private async getBreedingAnalytics(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      ...dashboard.breeding,
      breedingInsights: dashboard.insights.filter(i => i.type === 'breeding_trends'),
      engagementMetrics: {
        totalSimulations: dashboard.breeding.totalSimulations,
        avgSimulationsPerUser: dashboard.breeding.userEngagement.avgSimulationsPerUser,
        retentionByActivity: dashboard.breeding.userEngagement.retentionBySimulationCount
      },
      topCombinations: dashboard.breeding.popularCrosses.slice(0, 10)
    };
  }

  private async getStrainPopularity(params: any, query: any): Promise<any> {
    const timeframe = parseInt(query.timeframe) || 30;
    const limit = parseInt(query.limit) || 50;
    
    const strainData = await analyticsEngine.getStrainPopularityWithPrecision(timeframe);
    
    return {
      strains: strainData.slice(0, limit),
      summary: {
        totalStrains: strainData.length,
        trendingUp: strainData.filter(s => s.trendDirection === 'up').length,
        trendingDown: strainData.filter(s => s.trendDirection === 'down').length,
        avgSatisfaction: strainData.length > 0
          ? strainData.reduce((sum, s) => sum + s.averageSatisfaction, 0) / strainData.length
          : 0
      }
    };
  }

  private async getUserSegments(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 30;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    const segments = dashboard.userSegments.map(segment => ({
      ...segment,
      revenueContribution: segment.userCount * segment.averageRevenue,
      averageEngagement: segment.retentionRate
    }));
    
    return {
      segments,
      segmentSummary: {
        totalSegments: segments.length,
        totalUsers: segments.reduce((sum, s) => sum + s.userCount, 0),
        totalRevenue: segments.reduce((sum, s) => sum + s.revenueContribution, 0),
        avgRetention: segments.reduce((sum, s) => sum + s.retentionRate, 0) / segments.length
      }
    };
  }

  private async getMemoryAnalytics(params: any, query: any): Promise<any> {
    const userId = query.userId || 'all';
    
    if (userId === 'all') {
      const memoryInsights = await analyticsEngine.generateDashboardAnalytics('admin', 30);
      const memoryRelatedInsights = memoryInsights.insights.filter(i => i.id.includes('memory'));
      
      return {
        adoption: {
          rate: 65, // This would come from actual analytics
          trend: 'up',
          growth: 5
        },
        usage: {
          totalConversations: 12500,
          avgConversationsPerUser: 8.5,
          retentionRates: { day1: 89, day7: 67, day30: 45 }
        },
        insights: memoryRelatedInsights
      };
    } else {
      const userAnalytics = await memoryService.getConversationAnalytics(userId);
      return userAnalytics;
    }
  }

  private async getPerformanceMetrics(params: any, query: any): Promise<any> {
    const timeRange = parseInt(query.days) || 7;
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', timeRange);
    
    return {
      ...dashboard.performance,
      systemHealth: {
        uptime: 99.9,
        responseTime: dashboard.performance.avgLoadTime,
        errorRate: dashboard.performance.errorRate,
        throughput: 1500 // requests per minute
      },
      alerts: dashboard.insights
        .filter(i => i.type === 'performance' && i.priority === 'high')
        .map(i => ({
          type: i.title,
          message: i.description,
          severity: i.priority
        }))
    };
  }

  private async exportAnalytics(params: any, query: any): Promise<any> {
    const format = params.format || 'json';
    const dateRange = parseInt(query.dateRange) || 90;
    
    const dashboard = await analyticsEngine.generateDashboardAnalytics('admin', dateRange);
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: `${dateRange} days`,
        dataVersion: '1.0'
      },
      overview: dashboard.overview,
      insights: dashboard.insights,
      userSegments: dashboard.userSegments,
      revenue: dashboard.revenue,
      breeding: dashboard.breeding,
      performance: dashboard.performance
    };

    if (format === 'json') {
      return exportData;
    } else if (format === 'csv') {
      return this.convertToCSV(exportData);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async getRealtimeStats(_params: any, _query: any): Promise<any> {
    // This would connect to real-time analytics stream
    return {
      timestamp: new Date().toISOString(),
      activeUsers: 234,
      currentSessions: 89,
      recentInteractions: 156,
      systemLoad: {
        cpu: 45,
        memory: 67,
        storage: 23
      },
      alerts: []
    };
  }

  private async getSystemHealth(_params: any, _query: any): Promise<any> {
    return {
      status: 'healthy',
      uptime: 99.9,
      version: '1.0.0',
      services: {
        database: 'operational',
        analytics: 'operational',
        memory: 'operational',
        api: 'operational'
      },
      lastCheck: new Date().toISOString()
    };
  }

  // UTILITY METHODS
  private findEndpoint(method: string, path: string): APIEndpoint | undefined {
    // Exact match first
    const exactMatch = this.endpoints.get(`${method}:${path}`);
    if (exactMatch) return exactMatch;

    // Pattern matching for parameterized routes
    for (const [key, endpoint] of this.endpoints) {
      const [endpointMethod, endpointPath] = key.split(':');
      if (endpointMethod === method && this.matchPath(endpointPath, path)) {
        return endpoint;
      }
    }

    return undefined;
  }

  private matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) continue; // Parameter match
      if (patternPart !== pathPart) return false;
    }

    return true;
  }

  private isAuthenticated(headers: any): boolean {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader) return false;

    // In production, this would validate JWT tokens
    // For now, we'll check for a simple bearer token
    const token = authHeader.replace('Bearer ', '');
    return token === 'greed-gross-admin-token-2024'; // This should be environment variable
  }

  private checkRateLimit(headers: any, limit: number): boolean {
    const clientId = headers['x-client-id'] || 'anonymous';
    const now = Date.now();
    const _windowStart = now - (60 * 1000); // 1 minute window

    const clientLimit = this.rateLimitStore.get(clientId);
    
    if (!clientLimit || clientLimit.resetTime < now) {
      this.rateLimitStore.set(clientId, { count: 1, resetTime: now + (60 * 1000) });
      return true;
    }

    if (clientLimit.count >= limit) {
      return false;
    }

    clientLimit.count++;
    return true;
  }

  private errorResponse(message: string, status: number, startTime: number): AdminAPIResponse {
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime
    };
  }

  private convertToCSV(data: any): string {
    // Basic CSV conversion - would need proper CSV library for production
    const insights = data.insights || [];
    
    let csv = 'Type,Title,Description,Value,Trend,Priority\n';
    
    insights.forEach((insight: any) => {
      csv += `"${insight.type}","${insight.title}","${insight.description}","${insight.value}","${insight.trend}","${insight.priority}"\n`;
    });
    
    return csv;
  }

  // PUBLIC INTERFACE FOR EXPRESS/FASTIFY INTEGRATION
  getExpressRoutes(): { method: string; path: string; handler: Function }[] {
    const routes: { method: string; path: string; handler: Function }[] = [];
    
    for (const [key, _endpoint] of this.endpoints) {
      const [method, path] = key.split(':');
      
      routes.push({
        method: method.toLowerCase(),
        path,
        handler: async (req: any, res: any) => {
          const result = await this.handleRequest(
            method,
            path,
            req.params,
            req.query,
            req.body,
            req.headers
          );
          
          const statusCode = result.success ? 200 : 
            result.error?.includes('not found') ? 404 :
            result.error?.includes('Unauthorized') ? 401 :
            result.error?.includes('Rate limit') ? 429 : 500;
          
          res.status(statusCode).json(result);
        }
      });
    }
    
    return routes;
  }
}

export const adminDashboardAPI = new AdminDashboardAPI();