import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'native-base';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import LabChatScreen from '@/screens/LabChatScreen';
import GlobalChatScreen from '@/screens/GlobalChatScreen';
import StrainLibraryScreen from '@/screens/StrainLibraryScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type MainTabParamList = {
  LabChat: undefined;
  GlobalChat: undefined;
  StrainLibrary: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'Orbitron-Bold',
        },
      }}
    >
      <Tab.Screen
        name="LabChat"
        component={LabChatScreen}
        options={{
          title: 'Laboratorio',
          tabBarIcon: ({ color, size }) => (
            <Icon
              as={MaterialIcons}
              name="science"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="GlobalChat"
        component={GlobalChatScreen}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Icon
              as={MaterialIcons}
              name="forum"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="StrainLibrary"
        component={StrainLibraryScreen}
        options={{
          title: 'Libreria',
          tabBarIcon: ({ color, size }) => (
            <Icon
              as={MaterialCommunityIcons}
              name="cannabis"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Impostazioni',
          tabBarIcon: ({ color, size }) => (
            <Icon
              as={MaterialIcons}
              name="settings"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}