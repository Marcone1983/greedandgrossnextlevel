import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NativeBaseProvider } from 'native-base';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { store } from '@/store';
import { theme } from '@/constants/theme';
import { initializeServices } from '@/services/initialization';
import RootNavigator from '@/navigation/RootNavigator';
import { toastConfig } from '@/utils/toastConfig';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import { errorLogger } from '@/services/errorLogger';

// Splash screen handled by native code in React Native CLI

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = React.useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Font loading is handled differently in React Native CLI
        // Fonts should be linked using react-native link or manually

        await initializeServices();
      } catch (e) {
        errorLogger.error('Failed to prepare app', e, 'App.prepare');
      } finally {
        setAppIsReady(true);
        // Splash screen auto-hides in React Native CLI
      }
    }

    prepare();
  }, []);

  if (!appIsReady || showAnimatedSplash) {
    return <AnimatedSplashScreen onFinish={() => setShowAnimatedSplash(false)} />;
  }

  return (
    <Provider store={store}>
      <NativeBaseProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <RootNavigator />
            <Toast config={toastConfig} />
          </NavigationContainer>
        </SafeAreaProvider>
      </NativeBaseProvider>
    </Provider>
  );
}
