import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { store } from '@/store';
import { theme } from '@/constants/theme';
import { initializeServices } from '@/services/initialization';
import RootNavigator from '@/navigation/RootNavigator';
import { toastConfig } from '@/utils/toastConfig';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = React.useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Roboto: require('@assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Bold': require('@assets/fonts/Roboto-Bold.ttf'),
          Orbitron: require('@assets/fonts/Orbitron-Regular.ttf'),
          'Orbitron-Bold': require('@assets/fonts/Orbitron-Bold.ttf'),
        });

        await initializeServices();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
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
            <StatusBar style="light" />
            <RootNavigator />
            <Toast config={toastConfig} />
          </NavigationContainer>
        </SafeAreaProvider>
      </NativeBaseProvider>
    </Provider>
  );
}
