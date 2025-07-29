// Mocks must come BEFORE imports

// Mock Firebase wrapper
jest.mock('../firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('../util/fetchFriendsPets', () => ({
  fetchFriendsPets: jest.fn(() => Promise.resolve([])),
}));

// Mock Firestore methods to prevent ESM import
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn(), docs: [] })),
  doc: jest.fn(),
  collection: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  orderBy: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
}));

// Mock pet images
jest.mock('@/assets/pet-images', () => ({
  default: {
    cat: 'mock-cat.png',
    dog: 'mock-dog.png',
  },
}));

// Mock pet stats computation
jest.mock('../components/my-pet/my-pet-backend', () => ({
  computePetStats: () => ({
    updatedPet: {
      name: 'Mocky',
      hunger: 90,
      totalXp: 4000,
      image: 'cat',
    },
  }),
}));

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => cb()),
}));

// React Native Testing Library imports
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SocialScreen from '../app/(tabs)/social';

global.alert = jest.fn();

describe('SocialScreen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Renders main screen UI
  // Purpose: Verify that key UI elements like section headers are rendered
  // Expected: The "My Friends' Pets" and "My Study Groups" text should appear
  it('1. renders friend and group sections correctly', () => {
    const { getByText } = render(<SocialScreen />);
    expect(getByText("My Friends' Pets")).toBeTruthy();
    expect(getByText('My Study Groups')).toBeTruthy();
  });

  // Test 2: Prevents creating group with name too long
  // Purpose: Group name longer than 20 characters should be rejected
  // Expected: Alert should be shown with appropriate error message
  it('2. blocks creating group with too long name', async () => {
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);
    fireEvent.press(getByText('Create Study Group'));
    fireEvent.changeText(getByPlaceholderText('Group ID (Unique)'), 'shortid');
    fireEvent.changeText(getByPlaceholderText('Group Name'), 'ThisGroupNameIsWayTooLong');
    fireEvent.press(getByText('Create'));
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Group Name is too long! Max: 20 characters.');
    });
  });

  // Test 3: Prevents user from adding their own email as friend
  // Purpose: Prevent self-addition to friend list
  // Expected: Alert should be triggered saying self-addition is not allowed
  it('3. prevents adding self as friend', async () => {
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);
    fireEvent.press(getByText('Add Friend'));
    fireEvent.changeText(getByPlaceholderText("Enter friend's email"), 'test@example.com');
    fireEvent.press(getByText('Add'));
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('You cannot add yourself as a friend');
    });
  });
});
