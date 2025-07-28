import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import LoginScreen from '../app/LoginScreen';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('@/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  Link: ({ children }) => children,
}));

global.alert = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. renders login screen correctly
  it('renders login screen correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
  });

  // 2. calls Firebase auth with correct email and password
  it('calls Firebase auth with correct email and password', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), ' test@example.com ');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
    );
  });

  // 3. displays alert on invalid email error
  it('displays alert on invalid email error', async () => {
    const error = new Error('Invalid email');
    error.code = 'auth/invalid-email';
    signInWithEmailAndPassword.mockRejectedValueOnce(error);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'bademail');
    fireEvent.changeText(getByPlaceholderText('Password'), 'badpass');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Invalid email address.');
    });
  });
});
