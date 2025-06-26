// __tests__/TasksScreen.test.js
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { addDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import TasksScreen from '../app/(tabs)/tasks';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore');
  return {
    ...original,
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    deleteDoc: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(() => ({})),
    orderBy: jest.fn(),
  };
});

describe('TasksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<TasksScreen />);
    expect(getByText('My Tasks')).toBeTruthy();
    expect(getByText('+ New Task')).toBeTruthy();
  });

  it('opens modal on new task press', () => {
    const { getByText, getByPlaceholderText } = render(<TasksScreen />);
    fireEvent.press(getByText('+ New Task'));
    expect(getByPlaceholderText('Title')).toBeTruthy();
  });

  it('adds a task', async () => {
    addDoc.mockResolvedValue({ id: 'task1' });
    getDocs.mockResolvedValue({
      docs: [],
    });

    const { getByText, getByPlaceholderText } = render(<TasksScreen />);

    fireEvent.press(getByText('+ New Task'));
    fireEvent.changeText(getByPlaceholderText('Title'), 'New Task');
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(addDoc).toHaveBeenCalled());
  });

  it('deletes a task', async () => {
    const taskId = 'task1';
    const task = {
      id: taskId,
      title: 'Test Task',
      priority: 'High',
      completed: false,
    };

    getDocs.mockResolvedValue({
      docs: [{ id: taskId, data: () => task }],
    });

    const { getByText } = render(<TasksScreen />);

    // Add to DOM manually to simulate pre-existing task (not rendered by default)
    fireEvent.press(getByText('+ New Task'));
    fireEvent.press(getByText('Cancel'));
    
    deleteDoc.mockResolvedValue();
    fireEvent.press(getByText('Delete'));

    await waitFor(() => expect(deleteDoc).toHaveBeenCalled());
  });

  it('edits a task', async () => {
    const taskId = 'task1';
    const task = {
      id: taskId,
      title: 'Test Task',
      priority: 'High',
      completed: false,
    };

    getDocs.mockResolvedValue({
      docs: [{ id: taskId, data: () => task }],
    });

    const { getByText, getByPlaceholderText } = render(<TasksScreen />);
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('Title'), 'Updated Task');
    fireEvent.press(getByText('Update'));

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
  });
});
