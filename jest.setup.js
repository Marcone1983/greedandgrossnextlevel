import 'react-native-gesture-handler/jestSetup';
// import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve('mock-value')),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Redux store
jest.mock('@/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(() => ({
      auth: {
        user: null,
        isAuthenticated: false,
      },
      strain: {
        userStrains: [],
        isLoading: false,
      },
      chat: {
        globalMessages: [],
        isConnected: false,
      },
    })),
  },
}));

// Global test timeout
jest.setTimeout(10000);
