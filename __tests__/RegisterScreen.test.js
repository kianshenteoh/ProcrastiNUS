import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import RegisterScreen from '../app/RegisterScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Link: ({ children }) => children,
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  test('updates input fields', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'newpass');

    expect(getByPlaceholderText('Email').props.value).toBe('new@example.com');
    expect(getByPlaceholderText('Password').props.value).toBe('newpass');
  });

  test('registers user and creates Firestore doc', async () => {
    const mockReplace = jest.fn();
    const mockUser = { uid: 'uid123', email: 'new@example.com' };

    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: mockUser });
    jest.mocked(doc).mockReturnValue('mockDoc');

    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securepass');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'new@example.com', 'securepass');
      expect(setDoc).toHaveBeenCalledWith('mockDoc', {});
    });
  });

  test('shows alert on registration error', async () => {
    global.alert = jest.fn();
    createUserWithEmailAndPassword.mockRejectedValue(new Error('Registration failed'));

    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'fail@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'failpass');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Registration failed');
    });
  });
});
