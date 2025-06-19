import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { analyticsCollector } from '@/services/analyticsCollector';
import { useMemoryAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  isEnabled: boolean;
  updateSettings: (enabled: boolean) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEnabled, setIsEnabled] = React.useState(true);
  const memoryAnalytics = useMemoryAnalytics();

  useEffect(() => {
    // Initialize analytics when user is available
    if (user?.id) {
      analyticsCollector.initialize(user.id);
      loadAnalyticsSettings();
    }
  }, [user?.id]);

  const loadAnalyticsSettings = async () => {
    try {
      const enabled = await analyticsCollector.getAnalyticsSettings();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error loading analytics settings:', error);
    }
  };

  const updateSettings = async (enabled: boolean) => {
    try {
      await analyticsCollector.updateAnalyticsSettings(enabled);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error updating analytics settings:', error);
    }
  };

  const contextValue: AnalyticsContextType = {
    isEnabled,
    updateSettings
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}