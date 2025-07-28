import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import RegisterScreen from '../app/RegisterScreen';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Test 1: Renders essential input fields and button
test('renders input fields and register button', () => {
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
  
  expect(getByPlaceholderText('Name')).toBeTruthy();
  expect(getByPlaceholderText('Email')).toBeTruthy();
  expect(getByPlaceholderText('Password')).toBeTruthy();
  expect(getByText('Register')).toBeTruthy();
});

// Test 2: Shows error if fields are empty
test('shows alert if fields are empty', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');
  const { getByText } = render(<RegisterScreen />);
  
  fireEvent.press(getByText('Register'));

  expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields');
});

// Test 3: Prevents name longer than 15 characters
test('shows alert for name longer than 15 characters', async () => {
  const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

  fireEvent.changeText(getByPlaceholderText('Name'), 'averyverylongusername');
  fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Register'));

  expect(alertSpy).toHaveBeenCalledWith('Name is too long! Max: 15 characters.');
});

// Test 4: Successfully registers a user
test('registers user successfully', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

  fireEvent.changeText(getByPlaceholderText('Name'), 'John');
  fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Register'));

  await waitFor(() => {
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'john@example.com', 'password123');
    expect(setDoc).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'Registration Successful',
      'You can now log in with your new account.',
      expect.anything(),
      { cancelable: false }
    );
  });
});
