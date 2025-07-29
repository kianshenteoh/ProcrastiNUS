import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import RegisterScreen from '../app/RegisterScreen';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  Link: ({ children }) => children,
}));

global.alert = jest.fn();
global.Alert = { alert: jest.fn() };

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. UI renders properly
  it('renders register screen UI correctly', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  // 2. Empty fields trigger alert
  it('shows alert when fields are empty', () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Register'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // 3. Name too long triggers alert
  it('shows alert when name exceeds max length', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Name'), 'ThisNameIsWayTooLong');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Name is too long! Max: 15 characters.');
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // 4. Successful Firebase registration call
  it('calls Firebase auth with correct email and password', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'abc123' },
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('Email'), ' test@example.com ');
    fireEvent.changeText(getByPlaceholderText('Password'), 'mypassword');
    fireEvent.press(getByText('Register'));

    await waitFor(() =>
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'mypassword')
    );
  });
});
