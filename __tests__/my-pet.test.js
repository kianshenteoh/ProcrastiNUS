// Setup fake timers before all tests
beforeAll(() => {
  jest.useFakeTimers();
});

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      name: 'Test Pet',
      hunger: 80,
      totalXp: 1000,
      lastUpdated: Date.now(),
      image: 1,
      coins: 100,
      items: []
    })
  })),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ size: 1, docs: [] })),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    callback({ data: () => ({ coins: 100 }) });
    return () => {};
  }),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));
jest.mock('@/util/logActivity', () => ({
  logToAllGroupLogs: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(JSON.stringify({
    pet: {
      name: 'Test Pet',
      hunger: 80,
      totalXp: 1000,
      lastUpdated: Date.now(),
      image: 1,
      level: 1,
      xp: 0,
      xpToNext: 1000
    },
    wallet: { coins: 100 },
    inventory: [],
    timestamp: Date.now()
  }))),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
// Mock LoginScreen 
jest.mock('../app/LoginScreen', () => () => null);
// Mock pet images
jest.mock('@/assets/pet-images', () => ({
  0: 'mock-image-0',
  1: 'mock-image-1',
}));
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
global.alert = jest.fn();

// Import components after mocks
import PetAndBadgesBackend from '../components/my-pet/my-pet-backend';
import PetAndBadges from '../components/my-pet/my-pet-ui';

describe('Pet Page Backend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  // Test 1: renders backend component without crashing
  it('renders component without crashing', () => {
    const { toJSON } = render(<PetAndBadgesBackend />);
    expect(toJSON).toBeDefined();
  });

  // Test 2: calls Firebase functions during component initialization
  it('calls Firebase functions during component initialization', () => {
    const { doc } = require('firebase/firestore');
    render(<PetAndBadgesBackend />);
    expect(doc).toHaveBeenCalled();
  });

});

describe('PetAndBadges UI interactions', () => {
  const mockBuyFood = jest.fn();
  const mockUseFood = jest.fn();
  const mockRenamePet = jest.fn();
  const mockSimulateTimePassed = jest.fn();

  const baseProps = {
    pet: {
      name: 'Buddy',
      level: 2,
      xp: 200,
      xpToNext: 1000,
      hunger: 50,
      image: 1,
    },
    wallet: { coins: 100 },
    inventory: [],
    buyFood: mockBuyFood,
    useFood: mockUseFood,
    renamePet: mockRenamePet,
    HUNGER_THRESHOLD: 30,
    simulateTimePassed: mockSimulateTimePassed,
    isFeeding: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 3: opens and closes the shop modal
  it('opens and closes the shop modal', async () => {
    const { getByText, queryByText } = render(<PetAndBadges {...baseProps} />);
    fireEvent.press(getByText('Shop'));
    expect(getByText('Shop for treats')).toBeTruthy();
    fireEvent.press(getByText('Close'));
    await waitFor(() => {
      expect(queryByText('Shop for treats')).toBeNull();
    });
  });

  // Test 4: calls buyFood when tapping an affordable item
  it('calls buyFood when tapping an affordable item', () => {
    const { getByText } = render(<PetAndBadges {...baseProps} />);
    fireEvent.press(getByText('Shop'));
    fireEvent.press(getByText('Biscuit\n(+10%)'));
    expect(mockBuyFood).toHaveBeenCalledWith({
      id: 'biscuit',
      label: 'Biscuit\n(+10%)',
      cost: 30,
      hunger: 10,
      icon: 'cookie-bite',
    });
  });

  // Test 5: does not call buyFood when coins are insufficient
  it('does not call buyFood when coins are insufficient', () => {
    const lowCoinProps = { ...baseProps, wallet: { coins: 20 } };
    const { getByText } = render(<PetAndBadges {...lowCoinProps} />);
    fireEvent.press(getByText('Shop'));
    fireEvent.press(getByText('Biscuit\n(+10%)'));
    expect(mockBuyFood).not.toHaveBeenCalled();
  });

  // Test 6: alerts when inventory is full and trying to buy more
  it('alerts when inventory is full and trying to buy more', () => {
    const fullInvProps = {
      ...baseProps,
      inventory: Array(10).fill({ id: 'x' }),
    };
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<PetAndBadges {...fullInvProps} />);
    fireEvent.press(getByText('Shop'));
    fireEvent.press(getByText('Biscuit\n(+10%)'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Inventory Full',
      'You cannot carry more food. Please use some before buying more.',
      [{ text: 'OK', style: 'cancel' }]
    );
  });

});
