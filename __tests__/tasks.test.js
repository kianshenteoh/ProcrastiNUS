import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { addDoc } from 'firebase/firestore';
import TasksScreen from '../app/(tabs)/tasks';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@/util/logActivity', () => ({
  logToAllGroupLogs: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Swipeable: View,
    GestureHandlerRootView: View,
  };
});

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mockTaskId' })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(() => ({ update: jest.fn(), commit: jest.fn() })),
  increment: jest.fn(value => value),
  doc: jest.fn(),
}));

global.alert = jest.fn();

describe('TasksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: renders task screen UI correctly
  it('renders task screen UI correctly', () => {
    const { getByText } = render(<TasksScreen />);
    expect(getByText('My Tasks')).toBeTruthy();
    expect(getByText('+ New Task')).toBeTruthy();
  });

  // Test 2: shows alert if task title is too long
  it('shows alert if task title is too long', () => {
    const { getByText, getByPlaceholderText } = render(<TasksScreen />);
    fireEvent.press(getByText('+ New Task'));
    fireEvent.changeText(
      getByPlaceholderText('Title'),
      'A very very very long task title that exceeds thirty characters'
    );
    fireEvent.press(getByText('Save'));
    expect(global.alert).toHaveBeenCalledWith('Task title too long! Max: 30 characters.');
  });

  // Test 3: prevents task creation with empty title
  it('prevents task creation with empty title', () => {
    const { getByText, getByPlaceholderText } = render(<TasksScreen />);
    fireEvent.press(getByText('+ New Task'));
    fireEvent.changeText(getByPlaceholderText('Title'), '   ');
    fireEvent.press(getByText('Save'));
    expect(addDoc).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });

  // Test 4: calls Firebase on valid task creation
  it('calls Firebase on valid task creation', async () => {
    const { getByText, getByPlaceholderText } = render(<TasksScreen />);
    fireEvent.press(getByText('+ New Task'));
    fireEvent.changeText(getByPlaceholderText('Title'), 'Buy groceries');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          title: 'Buy groceries',
          priority: 'Medium',
          dueDate: null,
          completed: false,
          createdAt: expect.any(Date),
        }
      );
    });
  });
});
