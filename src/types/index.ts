export interface User {
  id: string;
  username: string;
  tier: 'free' | 'premium' | 'admin';
  joinDate: Date;
  lastActive: Date;
  stats: UserStats;
  preferences: UserPreferences;
  avatar?: string;
}

export interface UserStats {
  totalCrosses: number;
  strainsCreated: number;
  xp: number;
  level: number;
  badges: Badge[];
  dailyMessagesUsed: number;
  dailyCrossesUsed: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  memorySettings?: MemoryPrivacySettings;
}

export interface MemoryPrivacySettings {
  enableMemory: boolean;
  encryptSensitive: boolean;
  retentionDays: number;
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  gdprCompliant: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface Strain {
  id: string;
  name: string;
  parentA: string;
  parentB: string;
  type: 'sativa' | 'indica' | 'hybrid';
  thc: number;
  cbd: number;
  terpenes: Terpene[];
  effects: string[];
  flavors: string[];
  genetics: GeneticProfile;
  createdBy: string;
  createdAt: Date;
  popularity: number;
  imageUrl?: string;
}

export interface Terpene {
  name: string;
  percentage: number;
  effects: string[];
}

export interface GeneticProfile {
  phenotypes: string[];
  floweringTime: number;
  yield: string;
  difficulty: 'easy' | 'medium' | 'hard';
  resistance: string[];
  dominantTraits: string[];
}

export interface CrossRequest {
  parentA: string;
  parentB: string;
  userId: string;
}

export interface CrossResult {
  request: CrossRequest;
  result: Strain;
  prediction: {
    confidence: number;
    alternativePhenotypes: string[];
    warnings: string[];
  };
  cached: boolean;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'ai' | 'system';
  attachments?: MessageAttachment[];
  replyTo?: string;
}

export interface MessageAttachment {
  type: 'strain' | 'image' | 'link';
  data: any;
}

export interface Subscription {
  tier: 'free' | 'premium';
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  platform: 'ios' | 'android';
  transactionId?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  criteria: AchievementCriteria;
}

export interface AchievementCriteria {
  type: 'crosses' | 'strains' | 'social' | 'special';
  target: number;
  current: number;
}

export interface AnalyticsEvent {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalCrosses: number;
  popularStrains: Strain[];
  revenue: {
    daily: number;
    monthly: number;
    yearly: number;
  };
  systemHealth: {
    apiLatency: number;
    cacheHitRate: number;
    errorRate: number;
  };
}