// SocialScreen.test.js

// Setup fake timers before all tests
beforeAll(() => {
  jest.useFakeTimers();
});

import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    callback({ data: () => ({ coins: 42 }) });
    return () => {};
  }),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], size: 0 })),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'user@example.com' } },
  db: {},
}));

jest.mock('../util/fetchFriendsPets', () => ({
  fetchFriendsPets: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

import SocialScreen from '@/app/(tabs)/social';

const mockFetch = require('../util/fetchFriendsPets').fetchFriendsPets;
const { useRouter } = require('expo-router');
const router = useRouter();

// Helper to wrap the component in necessary providers
function renderWithProviders(ui) {
  return render(
    <MenuProvider>
      <NavigationContainer>{ui}</NavigationContainer>
    </MenuProvider>
  );
}

describe('SocialScreen unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue([]);
  });

  // Test 1: renders wallet coins correctly
  it('renders wallet coins correctly', async () => {
    const { findByText } = renderWithProviders(<SocialScreen />);
    // onSnapshot mock sets coins to 42
    expect(await findByText('42')).toBeTruthy();
  });

  // Test 2: shows friends section title
  it("displays 'My Friends' Pets' section title", () => {
    const { getByText } = renderWithProviders(<SocialScreen />);
    expect(getByText("My Friends' Pets")).toBeTruthy();
  });

  // Test 3: renders friend cards when fetchFriendsPets returns data
  it('renders friend cards when data is available', async () => {
    mockFetch.mockResolvedValue([
      {
        id: 'f1',
        image: 1,
        name: 'Fido',
        totalXp: 500,
        hunger: 70,
        ownerName: 'Alice',
        ownerId: 'alice'
      }
    ]);
    const { findByText } = renderWithProviders(<SocialScreen />);
    expect(await findByText('Fido')).toBeTruthy();
    expect(await findByText('Lvl 0')).toBeTruthy();      
    expect(await findByText('Energy: 70%')).toBeTruthy();
    expect(await findByText('Owner: Alice')).toBeTruthy();
  });

  // Test 4: fetchFriendsPets is called on mount
    it('calls fetchFriendsPets on mount', () => {
    renderWithProviders(<SocialScreen />);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    });

});
