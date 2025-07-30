import 'react-native-gesture-handler/jestSetup';

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  Link: ({ children }) => children,
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FontAwesome5: () => <View />,
  };
});

// Mock image imports
// jest.mock('@/assets/images/logo.png', () => 'mocked-image');

// Avoid warning about native animation
// jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

