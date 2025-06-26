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


describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  test('updates email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    
    expect(getByPlaceholderText('Email').props.value).toBe('test@example.com');
    expect(getByPlaceholderText('Password').props.value).toBe('password123');
  });

  test('calls signInWithEmailAndPassword on login', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'abc' } });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Login'));

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@gmail.com', '123456')
    );
  });

  test('shows error alert on login failure', async () => {
    global.alert = jest.fn();
    signInWithEmailAndPassword.mockRejectedValue(new Error('Login failed'));

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'fail@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Login'));

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith('Login failed')
    );
  });

  test('quick login autofills credentials and logs in', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'quick' } });

    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Quick Login (Developer)'));

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), '9@gmail.com', '123456')
    );
  });
});
