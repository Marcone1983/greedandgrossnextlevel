import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { memoryService, ConversationEntry, UserMemoryProfile, MemorySettings } from '@/services/memoryService';

interface ConversationMemoryState {
  isLoaded: boolean;
  isEnabled: boolean;
  contextSummary: string;
  userProfile: UserMemoryProfile;
  recentConversations: ConversationEntry[];
  suggestedPrompts: string[];
  memoryStrength: 'weak' | 'moderate' | 'strong';
  currentSession: string;
  analytics: {
    totalConversations: number;
    averageSessionLength: number;
    topStrains: string[];
    topEffects: string[];
    queryTypeDistribution: Record<string, number>;
    weeklyActivity: number[];
  };
}

interface UseConversationMemoryReturn extends ConversationMemoryState {
  recordConversation: (query: string, aiResponse: string, metadata?: Partial<ConversationEntry>) => Promise<void>;
  loadConversationContext: () => Promise<void>;
  getContextForAI: () => string;
  updateMemorySettings: (settings: Partial<MemorySettings>) => Promise<void>;
  getMemorySettings: () => Promise<MemorySettings>;
  clearAllMemory: () => Promise<void>;
  exportUserData: () => Promise<any>;
  startNewSession: () => Promise<void>;
  getSuggestedPrompt: () => string | null;
  getMemoryStatus: () => { 
    enabled: boolean; 
    strength: 'weak' | 'moderate' | 'strong'; 
    lastActivity: string;
    conversationCount: number;
  };
}

export function useConversationMemory(): UseConversationMemoryReturn {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [state, setState] = useState<ConversationMemoryState>({
    isLoaded: false,
    isEnabled: true,
    contextSummary: '',
    userProfile: {
      userId: user?.id || '',
      preferredStrains: [],
      avoidedStrains: [],
      preferredEffects: [],
      avoidedEffects: [],
      typicalUseCases: [],
      experienceLevel: 'beginner',
      conversationStyle: 'detailed',
      lastUpdated: new Date()
    },
    recentConversations: [],
    suggestedPrompts: [],
    memoryStrength: 'weak',
    currentSession: '',
    analytics: {
      totalConversations: 0,
      averageSessionLength: 0,
      topStrains: [],
      topEffects: [],
      queryTypeDistribution: {},
      weeklyActivity: []
    }
  });

  // LOAD CONVERSATION CONTEXT
  const loadConversationContext = useCallback(async () => {
    if (!user?.id) return;

    try {
      const context = await memoryService.getConversationContext(user.id);
      const settings = await memoryService.getMemorySettings(user.id);
      const analytics = await memoryService.getConversationAnalytics(user.id);

      const memoryStrength = calculateMemoryStrength(
        context.recentConversations.length,
        analytics.totalConversations
      );

      setState(prev => ({
        ...prev,
        isLoaded: true,
        isEnabled: settings.enabled,
        contextSummary: context.contextSummary,
        userProfile: context.userProfile,
        recentConversations: context.recentConversations,
        suggestedPrompts: context.suggestedPrompts,
        memoryStrength,
        analytics
      }));
    } catch (error) {
      console.error('Error loading conversation context:', error);
      setState(prev => ({ ...prev, isLoaded: true, isEnabled: false }));
    }
  }, [user?.id]);

  // RECORD CONVERSATION
  const recordConversation = useCallback(async (
    query: string, 
    aiResponse: string, 
    metadata: Partial<ConversationEntry> = {}
  ) => {
    if (!user?.id || !state.isEnabled) return;

    try {
      await memoryService.recordConversation(user.id, query, aiResponse, metadata);
      
      // Reload context to update state
      await loadConversationContext();
    } catch (error) {
      console.error('Error recording conversation:', error);
    }
  }, [user?.id, state.isEnabled, loadConversationContext]);

  // GET CONTEXT FOR AI
  const getContextForAI = useCallback((): string => {
    if (!state.isEnabled || !state.contextSummary) {
      return '';
    }

    let aiContext = `${state.contextSummary}\n`;
    
    if (state.recentConversations.length > 0) {
      aiContext += `\nULTIME CONVERSAZIONI:\n`;
      state.recentConversations.slice(0, 3).forEach((conv, index) => {
        aiContext += `${index + 1}. ${conv.query.substring(0, 100)}...\n`;
      });
    }

    aiContext += `\nTieni conto di questo contesto per personalizzare la risposta.\n`;
    
    return aiContext;
  }, [state.isEnabled, state.contextSummary, state.recentConversations]);

  // UPDATE MEMORY SETTINGS
  const updateMemorySettings = useCallback(async (settings: Partial<MemorySettings>) => {
    if (!user?.id) return;

    try {
      await memoryService.updateMemorySettings(user.id, settings);
      
      if (settings.enabled !== undefined) {
        setState(prev => ({ ...prev, isEnabled: settings.enabled! }));
      }
    } catch (error) {
      console.error('Error updating memory settings:', error);
    }
  }, [user?.id]);

  // GET MEMORY SETTINGS
  const getMemorySettings = useCallback(async (): Promise<MemorySettings> => {
    if (!user?.id) {
      return {
        enabled: false,
        retentionDays: 365,
        encryptSensitiveData: true,
        allowAnalytics: true,
        autoSessionSave: true
      };
    }

    return await memoryService.getMemorySettings(user.id);
  }, [user?.id]);

  // CLEAR ALL MEMORY
  const clearAllMemory = useCallback(async () => {
    if (!user?.id) return;

    try {
      await memoryService.deleteAllUserData(user.id);
      
      // Reset state
      setState(prev => ({
        ...prev,
        contextSummary: '',
        userProfile: {
          userId: user.id,
          preferredStrains: [],
          avoidedStrains: [],
          preferredEffects: [],
          avoidedEffects: [],
          typicalUseCases: [],
          experienceLevel: 'beginner',
          conversationStyle: 'detailed',
          lastUpdated: new Date()
        },
        recentConversations: [],
        suggestedPrompts: [],
        memoryStrength: 'weak',
        analytics: {
          totalConversations: 0,
          averageSessionLength: 0,
          topStrains: [],
          topEffects: [],
          queryTypeDistribution: {},
          weeklyActivity: []
        }
      }));
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }, [user?.id]);

  // EXPORT USER DATA
  const exportUserData = useCallback(async () => {
    if (!user?.id) return null;

    try {
      return await memoryService.exportUserData(user.id);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }, [user?.id]);

  // START NEW SESSION
  const startNewSession = useCallback(async () => {
    try {
      const sessionId = await memoryService.startNewSession();
      setState(prev => ({ ...prev, currentSession: sessionId }));
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  }, []);

  // GET SUGGESTED PROMPT
  const getSuggestedPrompt = useCallback((): string | null => {
    if (state.suggestedPrompts.length === 0) return null;
    
    // Rotate through suggested prompts
    const randomIndex = Math.floor(Math.random() * state.suggestedPrompts.length);
    return state.suggestedPrompts[randomIndex];
  }, [state.suggestedPrompts]);

  // GET MEMORY STATUS
  const getMemoryStatus = useCallback(() => {
    const lastActivity = state.recentConversations[0]?.timestamp;
    const lastActivityString = lastActivity 
      ? formatTimeAgo(lastActivity)
      : 'Nessuna attività';

    return {
      enabled: state.isEnabled,
      strength: state.memoryStrength,
      lastActivity: lastActivityString,
      conversationCount: state.analytics.totalConversations
    };
  }, [state.isEnabled, state.memoryStrength, state.recentConversations, state.analytics.totalConversations]);

  // EFFECTS
  useEffect(() => {
    if (user?.id) {
      loadConversationContext();
    }
  }, [user?.id, loadConversationContext]);

  // Auto-save session on app state change
  useEffect(() => {
    const handleAppStateChange = () => {
      if (state.isEnabled && user?.id) {
        memoryService.saveSession();
      }
    };

    // Save session every 5 minutes if active
    const interval = setInterval(() => {
      if (state.isEnabled && user?.id) {
        memoryService.saveSession();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      handleAppStateChange();
    };
  }, [state.isEnabled, user?.id]);

  return {
    ...state,
    recordConversation,
    loadConversationContext,
    getContextForAI,
    updateMemorySettings,
    getMemorySettings,
    clearAllMemory,
    exportUserData,
    startNewSession,
    getSuggestedPrompt,
    getMemoryStatus
  };
}

// UTILITY FUNCTIONS
function calculateMemoryStrength(
  recentCount: number, 
  totalCount: number
): 'weak' | 'moderate' | 'strong' {
  if (totalCount < 5) return 'weak';
  if (totalCount < 20) return 'moderate';
  return 'strong';
}

function formatTimeAgo(date: Date): string {
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