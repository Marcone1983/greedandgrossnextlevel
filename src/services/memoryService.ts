import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import CryptoJS from 'crypto-js';
// import { User } from '@/types';

export interface ConversationEntry {
  id?: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  query: string;
  aiResponse: string;
  strainsHentioned: string[];
  queryType: 'breeding' | 'recommendation' | 'education' | 'general';
  userFeedback?: 'helpful' | 'not_helpful';
  queryIntent?: string;
  effectsRequested?: string[];
  isEncrypted?: boolean;
}

export interface UserMemoryProfile {
  userId: string;
  preferredStrains: string[];
  avoidedStrains: string[];
  preferredEffects: string[];
  avoidedEffects: string[];
  typicalUseCases: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  growingType?: 'indoor' | 'outdoor' | 'both';
  conversationStyle: 'detailed' | 'brief' | 'technical';
  lastUpdated: Date;
  privacySettings?: {
    enableMemory?: boolean;
    encryptSensitive?: boolean;
    allowAnalytics?: boolean;
    retentionDays?: number;
  };
}

export interface MemorySettings {
  enabled: boolean;
  enableMemory?: boolean;
  retentionDays: number;
  encryptSensitiveData: boolean;
  encryptSensitive?: boolean;
  allowAnalytics: boolean;
  autoSessionSave: boolean;
}

class MemoryService {
  private db = getFirestore();
  private encryptionKey: string;
  private currentSession: string;
  private sessionConversations: ConversationEntry[] = [];

  constructor() {
    this.encryptionKey = 'greed-gross-memory-key-2024';
    this.currentSession = this.generateSessionId();
  }

  // SESSION MANAGEMENT
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startNewSession(): Promise<string> {
    // Save current session if exists
    if (this.sessionConversations.length > 0) {
      await this.saveSession();
    }

    this.currentSession = this.generateSessionId();
    this.sessionConversations = [];
    return this.currentSession;
  }

  async saveSession(): Promise<void> {
    if (this.sessionConversations.length === 0) return;

    try {
      const sessionData = {
        sessionId: this.currentSession,
        conversations: this.sessionConversations,
        startTime: this.sessionConversations[0]?.timestamp,
        endTime: new Date(),
        conversationCount: this.sessionConversations.length,
      };

      await AsyncStorage.setItem(
        `@greedgross:session:${this.currentSession}`,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      // Error saving session
    }
  }

  // CONVERSATION RECORDING
  async recordConversation(
    userId: string,
    query: string,
    aiResponse: string,
    metadata: Partial<ConversationEntry> = {}
  ): Promise<void> {
    const settings = await this.getMemorySettings(userId);
    if (!settings.enabled) return;

    const strainsHentioned = this.extractStrains(aiResponse);
    const effectsRequested = this.extractEffects(query);
    const queryType = this.classifyQuery(query);

    const conversation: ConversationEntry = {
      userId,
      sessionId: this.currentSession,
      timestamp: new Date(),
      query: settings.encryptSensitiveData ? this.encrypt(query) : query,
      aiResponse: settings.encryptSensitiveData ? this.encrypt(aiResponse) : aiResponse,
      strainsHentioned,
      effectsRequested,
      queryType,
      isEncrypted: settings.encryptSensitiveData,
      ...metadata,
    };

    // Add to current session
    this.sessionConversations.push(conversation);

    // Save to Firebase
    try {
      await addDoc(collection(this.db, 'conversations'), conversation);

      // Update user profile
      await this.updateUserProfile(userId, conversation);
    } catch (error) {
      // Error recording conversation
    }
  }

  // CONTEXT RECONSTRUCTION
  async getConversationContext(
    userId: string,
    limitCount: number = 20
  ): Promise<{
    recentConversations: ConversationEntry[];
    userProfile: UserMemoryProfile;
    contextSummary: string;
    suggestedPrompts: string[];
  }> {
    try {
      // Get recent conversations
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(conversationsQuery);
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as ConversationEntry[];

      // Decrypt if needed
      const decryptedConversations = conversations.map(conv => ({
        ...conv,
        query: conv.isEncrypted ? this.decrypt(conv.query) : conv.query,
        aiResponse: conv.isEncrypted ? this.decrypt(conv.aiResponse) : conv.aiResponse,
      }));

      // Get user profile
      const userProfile = await this.getUserProfile(userId);

      // Generate context summary
      const contextSummary = this.generateContextSummary(decryptedConversations, userProfile);

      // Generate suggested prompts
      const suggestedPrompts = this.generateSuggestedPrompts(userProfile, decryptedConversations);

      return {
        recentConversations: decryptedConversations,
        userProfile,
        contextSummary,
        suggestedPrompts,
      };
    } catch (error) {
      // Error getting conversation context
      return {
        recentConversations: [],
        userProfile: await this.createDefaultProfile(userId),
        contextSummary: '',
        suggestedPrompts: [],
      };
    }
  }

  // USER PROFILE MANAGEMENT
  async getUserProfile(userId: string): Promise<UserMemoryProfile> {
    try {
      const profileData = await AsyncStorage.getItem(`@greedgross:profile:${userId}`);
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch (error) {
      // Error getting user profile
    }

    return this.createDefaultProfile(userId);
  }

  async updateUserProfile(userId: string, conversation: ConversationEntry): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);

      // Update strains preferences
      conversation.strainsHentioned?.forEach(strain => {
        if (!profile.preferredStrains.includes(strain)) {
          profile.preferredStrains.push(strain);
        }
      });

      // Update effects preferences
      conversation.effectsRequested?.forEach(effect => {
        if (!profile.preferredEffects.includes(effect)) {
          profile.preferredEffects.push(effect);
        }
      });

      // Update experience level based on query complexity
      profile.experienceLevel = this.detectExperienceLevel(
        conversation.query,
        profile.experienceLevel
      );

      // Update conversation style
      profile.conversationStyle = this.detectConversationStyle(conversation.query);

      profile.lastUpdated = new Date();

      await AsyncStorage.setItem(`@greedgross:profile:${userId}`, JSON.stringify(profile));
    } catch (error) {
      // Error updating user profile
    }
  }

  private createDefaultProfile(userId: string): UserMemoryProfile {
    return {
      userId,
      preferredStrains: [],
      avoidedStrains: [],
      preferredEffects: [],
      avoidedEffects: [],
      typicalUseCases: [],
      experienceLevel: 'beginner',
      conversationStyle: 'detailed',
      lastUpdated: new Date(),
    };
  }

  // AI CONTEXT GENERATION
  generateContextSummary(conversations: ConversationEntry[], profile: UserMemoryProfile): string {
    if (conversations.length === 0) return '';

    const recentStrains = [...new Set(conversations.flatMap(c => c.strainsHentioned || []))];
    const _recentEffects = [...new Set(conversations.flatMap(c => c.effectsRequested || []))];
    const queryTypes = conversations.map(c => c.queryType);

    let summary = `CONTESTO CONVERSAZIONI PRECEDENTI:\n`;

    if (profile.preferredStrains.length > 0) {
      summary += `- Strain preferiti: ${profile.preferredStrains.slice(0, 5).join(', ')}\n`;
    }

    if (profile.preferredEffects.length > 0) {
      summary += `- Effetti preferiti: ${profile.preferredEffects.slice(0, 5).join(', ')}\n`;
    }

    if (recentStrains.length > 0) {
      summary += `- Strain discussi recentemente: ${recentStrains.slice(0, 3).join(', ')}\n`;
    }

    summary += `- Livello esperienza: ${profile.experienceLevel}\n`;
    summary += `- Stile conversazione: ${profile.conversationStyle}\n`;

    if (conversations.length > 0) {
      summary += `- Ultima conversazione: ${this.getTimeAgo(conversations[0].timestamp)}\n`;
    }

    const breedingQueries = queryTypes.filter(t => t === 'breeding').length;
    if (breedingQueries > 0) {
      summary += `- Interesse nel breeding: ${breedingQueries} domande recenti\n`;
    }

    return summary;
  }

  generateSuggestedPrompts(
    profile: UserMemoryProfile,
    conversations: ConversationEntry[]
  ): string[] {
    const suggestions: string[] = [];

    if (profile.preferredStrains.length > 0) {
      suggestions.push(`Raccontami di più su ${profile.preferredStrains[0]}`);
      suggestions.push(`Come posso migliorare la coltivazione di ${profile.preferredStrains[0]}?`);
    }

    if (profile.preferredEffects.length > 0) {
      suggestions.push(`Quali strain danno effetti ${profile.preferredEffects[0]}?`);
    }

    const lastBreeding = conversations.find(c => c.queryType === 'breeding');
    if (lastBreeding) {
      suggestions.push(`Continua la discussione sul breeding`);
    }

    if (profile.experienceLevel === 'beginner') {
      suggestions.push(`Consigli per principianti nella coltivazione`);
      suggestions.push(`Come scegliere la prima strain da coltivare?`);
    }

    suggestions.push(`Strain trending del momento`);
    suggestions.push(`Novità nel mondo della genetica cannabis`);

    return suggestions.slice(0, 5);
  }

  // UTILITY FUNCTIONS
  private extractStrains(text: string): string[] {
    const commonStrains = [
      'Blue Dream',
      'White Widow',
      'OG Kush',
      'Sour Diesel',
      'Green Crack',
      'Northern Lights',
      'Purple Haze',
      'Jack Herer',
      'Granddaddy Purple',
      'Skunk #1',
      'AK-47',
      'Blueberry',
      'Amnesia Haze',
      'Girl Scout Cookies',
    ];

    return commonStrains.filter(strain => text.toLowerCase().includes(strain.toLowerCase()));
  }

  private extractEffects(text: string): string[] {
    const effects = [
      'creative',
      'energetic',
      'relaxing',
      'sleepy',
      'focused',
      'happy',
      'euphoric',
      'uplifting',
      'calming',
      'productive',
      'social',
      'hungry',
    ];

    return effects.filter(effect => text.toLowerCase().includes(effect.toLowerCase()));
  }

  private classifyQuery(query: string): ConversationEntry['queryType'] {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes('cross') ||
      lowerQuery.includes('breed') ||
      lowerQuery.includes('incrocio')
    ) {
      return 'breeding';
    }
    if (
      lowerQuery.includes('recommend') ||
      lowerQuery.includes('suggest') ||
      lowerQuery.includes('consiglia')
    ) {
      return 'recommendation';
    }
    if (
      lowerQuery.includes('how') ||
      lowerQuery.includes('why') ||
      lowerQuery.includes('come') ||
      lowerQuery.includes('perché')
    ) {
      return 'education';
    }

    return 'general';
  }

  private detectExperienceLevel(
    query: string,
    currentLevel: string
  ): UserMemoryProfile['experienceLevel'] {
    const technicalTerms = [
      'terpenes',
      'phenotype',
      'genotype',
      'breeding',
      'feminized',
      'autoflowering',
    ];
    const beginnerTerms = ['first time', 'beginner', 'start', 'easy', 'simple'];

    const hasTechnical = technicalTerms.some(term => query.toLowerCase().includes(term));
    const hasBeginner = beginnerTerms.some(term => query.toLowerCase().includes(term));

    if (hasTechnical && currentLevel !== 'expert') {
      return currentLevel === 'beginner' ? 'intermediate' : 'expert';
    }
    if (hasBeginner) {
      return 'beginner';
    }

    return currentLevel as UserMemoryProfile['experienceLevel'];
  }

  private detectConversationStyle(query: string): UserMemoryProfile['conversationStyle'] {
    if (query.length > 100) return 'detailed';
    if (query.split(' ').length < 5) return 'brief';
    return 'detailed';
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} giorni fa`;
    if (hours > 0) return `${hours} ore fa`;
    if (minutes > 0) return `${minutes} minuti fa`;
    return 'poco fa';
  }

  // ENCRYPTION
  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  private decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      // Decryption error
      return encryptedText;
    }
  }

  // SETTINGS MANAGEMENT
  async getMemorySettings(userId: string): Promise<MemorySettings> {
    try {
      const settings = await AsyncStorage.getItem(`@greedgross:memory-settings:${userId}`);
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      // Error getting memory settings
    }

    return {
      enabled: true,
      retentionDays: 365,
      encryptSensitiveData: true,
      allowAnalytics: true,
      autoSessionSave: true,
    };
  }

  async updateMemorySettings(userId: string, settings: Partial<MemorySettings>): Promise<void> {
    try {
      const currentSettings = await this.getMemorySettings(userId);
      const newSettings = { ...currentSettings, ...settings };

      await AsyncStorage.setItem(
        `@greedgross:memory-settings:${userId}`,
        JSON.stringify(newSettings)
      );
    } catch (error) {
      // Error updating memory settings
    }
  }

  // PRIVACY & GDPR
  async exportUserData(userId: string): Promise<any> {
    try {
      const conversations = await this.getAllUserConversations(userId);
      const profile = await this.getUserProfile(userId);
      const settings = await this.getMemorySettings(userId);

      return {
        userId,
        exportDate: new Date(),
        conversations: conversations.map(conv => ({
          ...conv,
          query: conv.isEncrypted ? this.decrypt(conv.query) : conv.query,
          aiResponse: conv.isEncrypted ? this.decrypt(conv.aiResponse) : conv.aiResponse,
        })),
        profile,
        settings,
      };
    } catch (error) {
      // Error exporting user data
      throw new Error('Failed to export user data');
    }
  }

  async deleteAllUserData(userId: string): Promise<void> {
    try {
      // Delete from Firebase
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(conversationsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete from AsyncStorage
      await AsyncStorage.removeItem(`@greedgross:profile:${userId}`);
      await AsyncStorage.removeItem(`@greedgross:memory-settings:${userId}`);

      // Clear session data
      this.sessionConversations = [];
    } catch (error) {
      // Error deleting user data
      throw new Error('Failed to delete user data');
    }
  }

  private async getAllUserConversations(userId: string): Promise<ConversationEntry[]> {
    const conversationsQuery = query(
      collection(this.db, 'conversations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(conversationsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as ConversationEntry[];
  }

  // ANALYTICS INTEGRATION
  async getConversationAnalytics(userId: string): Promise<{
    totalConversations: number;
    averageSessionLength: number;
    topStrains: string[];
    topEffects: string[];
    queryTypeDistribution: Record<string, number>;
    weeklyActivity: number[];
  }> {
    try {
      const conversations = await this.getAllUserConversations(userId);

      return {
        totalConversations: conversations.length,
        averageSessionLength: this.calculateAverageSessionLength(conversations),
        topStrains: this.getTopStrains(conversations),
        topEffects: this.getTopEffects(conversations),
        queryTypeDistribution: this.getQueryTypeDistribution(conversations),
        weeklyActivity: this.getWeeklyActivity(conversations),
      };
    } catch (error) {
      // Error getting conversation analytics
      return {
        totalConversations: 0,
        averageSessionLength: 0,
        topStrains: [],
        topEffects: [],
        queryTypeDistribution: {},
        weeklyActivity: [],
      };
    }
  }

  private calculateAverageSessionLength(conversations: ConversationEntry[]): number {
    const sessions = [...new Set(conversations.map(c => c.sessionId))];
    if (sessions.length === 0) return 0;

    const sessionLengths = sessions.map(sessionId => {
      const sessionConvs = conversations.filter(c => c.sessionId === sessionId);
      return sessionConvs.length;
    });

    return sessionLengths.reduce((sum, length) => sum + length, 0) / sessions.length;
  }

  private getTopStrains(conversations: ConversationEntry[]): string[] {
    const strainCounts: Record<string, number> = {};

    conversations.forEach(conv => {
      conv.strainsHentioned?.forEach(strain => {
        strainCounts[strain] = (strainCounts[strain] || 0) + 1;
      });
    });

    return Object.entries(strainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([strain]) => strain);
  }

  private getTopEffects(conversations: ConversationEntry[]): string[] {
    const effectCounts: Record<string, number> = {};

    conversations.forEach(conv => {
      conv.effectsRequested?.forEach(effect => {
        effectCounts[effect] = (effectCounts[effect] || 0) + 1;
      });
    });

    return Object.entries(effectCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([effect]) => effect);
  }

  private getQueryTypeDistribution(conversations: ConversationEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    conversations.forEach(conv => {
      distribution[conv.queryType] = (distribution[conv.queryType] || 0) + 1;
    });

    return distribution;
  }

  private getWeeklyActivity(conversations: ConversationEntry[]): number[] {
    const weeklyActivity = new Array(7).fill(0);

    conversations.forEach(conv => {
      const dayOfWeek = conv.timestamp.getDay();
      weeklyActivity[dayOfWeek]++;
    });

    return weeklyActivity;
  }
}

export const memoryService = new MemoryService();
