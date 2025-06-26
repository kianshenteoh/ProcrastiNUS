import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { getDoc, setDoc } from 'firebase/firestore';
import SocialScreen from '../app/(tabs)/social';

console.log(SocialScreen);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'user@example.com' } },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

describe('SocialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders friend modal when triggered', async () => {
    const { getByText, queryByPlaceholderText } = render(<SocialScreen />);

    fireEvent.press(getByText('Add Friend'));

    await waitFor(() => {
      expect(queryByPlaceholderText("Enter friend's email")).toBeTruthy();
    });
  });

  test('handles invalid friend email input (empty)', async () => {
    global.alert = jest.fn();
    const { getByText } = render(<SocialScreen />);

    fireEvent.press(getByText('Add Friend'));
    await waitFor(() => {
      fireEvent.press(getByText('Add'));
    });

    expect(global.alert).toHaveBeenCalledWith("Please enter a friend's email");
  });

  test('shows alert if trying to add self', async () => {
    global.alert = jest.fn();
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);

    fireEvent.press(getByText('Add Friend'));
    fireEvent.changeText(getByPlaceholderText("Enter friend's email"), 'user@example.com');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('You cannot add yourself as a friend');
    });
  });

  test('handles non-existent friend user', async () => {
    global.alert = jest.fn();
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const { getByText, getByPlaceholderText } = render(<SocialScreen />);

    fireEvent.press(getByText('Add Friend'));
    fireEvent.changeText(getByPlaceholderText("Enter friend's email"), 'friend@example.com');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('User not found');
    });
  });

  test('adds friend successfully', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true });
    setDoc.mockResolvedValue();
    global.alert = jest.fn();

    const { getByText, getByPlaceholderText } = render(<SocialScreen />);

    fireEvent.press(getByText('Add Friend'));
    fireEvent.changeText(getByPlaceholderText("Enter friend's email"), 'friend@example.com');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Friend added!');
    });
  });
});
