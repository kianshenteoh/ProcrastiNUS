import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import ViewPetScreen from '../app/view-pet';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(() => ({})),
}));

jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'test@email.com' } },
  db: {},
}));

jest.mock('@/assets/pet-images', () => ({
  dog: 'mockImagePath',
}));

describe('ViewPetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    useLocalSearchParams.mockReturnValue({ friendId: undefined });
    const { getByText } = render(<ViewPetScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  test('renders pet info correctly after loading', async () => {
    useLocalSearchParams.mockReturnValue({ friendId: 'friend123' });

    getDoc.mockImplementation((ref) => {
      if (ref.path?.includes('pet')) {
        return Promise.resolve({ exists: () => true, data: () => ({ name: 'Buddy', level: 2, hunger: 60, image: 'dog' }) });
      }
      if (ref.path?.includes('wallet')) {
        return Promise.resolve({ exists: () => true, data: () => ({ coins: 10 }) });
      }
      if (ref.path?.includes('inventory')) {
        return Promise.resolve({ exists: () => true, data: () => ({ items: [] }) });
      }
      return Promise.resolve({ exists: () => false });
    });

    const { findByText } = render(<ViewPetScreen />);

    expect(await findByText('Buddy')).toBeTruthy();
    expect(await findByText('Lvl 2')).toBeTruthy();
    expect(await findByText('Hunger: 60%')).toBeTruthy();
  });

  test('disables shop item if not enough coins', async () => {
    useLocalSearchParams.mockReturnValue({ friendId: 'friend123' });
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Buddy', level: 2, hunger: 60, image: 'dog' }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ coins: 1 }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) });

    const { getByText, findByText } = render(<ViewPetScreen />);

    await findByText('Buddy');
    fireEvent.press(getByText('Shop'));
    const expensiveItem = await findByText('Big Mac');
    expect(expensiveItem.parent.props.accessibilityState.disabled).toBe(true);
  });

  test('buyFood updates wallet and inventory', async () => {
    useLocalSearchParams.mockReturnValue({ friendId: 'friend123' });
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Buddy', level: 2, hunger: 60, image: 'dog' }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ coins: 10 }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) });

    const { getByText, findByText } = render(<ViewPetScreen />);

    await findByText('Buddy');
    fireEvent.press(getByText('Shop'));
    const item = await findByText('Biscuit');
    fireEvent.press(item);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
    });
  });

  test('useFood updates pet hunger and inventory', async () => {
    useLocalSearchParams.mockReturnValue({ friendId: 'friend123' });

    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Buddy', level: 2, hunger: 60, image: 'dog' }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ coins: 10 }) })
           .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [{ id: 'snack', label: 'Snack', cost: 3, hunger: 15, icon: 'bone' }] }) });

    const { findByText, getByText } = render(<ViewPetScreen />);
    await findByText('Snack');
    fireEvent.press(getByText('Snack'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
    });
  });
});
