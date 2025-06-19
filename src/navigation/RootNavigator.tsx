import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import MainNavigator from './MainNavigator';
import PaywallScreen from '@/screens/PaywallScreen';
import AdminPanel from '@/screens/AdminPanel';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  Paywall: { feature: string };
  AdminPanel: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isAdmin } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 3000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0D1117' },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen 
            name="Paywall" 
            component={PaywallScreen}
            options={{
              presentation: 'modal',
              cardOverlayEnabled: true,
            }}
          />
          {isAdmin && (
            <Stack.Screen 
              name="AdminPanel" 
              component={AdminPanel}
              options={{
                presentation: 'modal',
              }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}