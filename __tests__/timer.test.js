beforeAll(() => {
  jest.useFakeTimers();
});

import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import { act, fireEvent, render } from '@testing-library/react-native';
import PomodoroScreen from '../app/(tabs)/timer';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ coins: 10 }) })),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ size: 1, docs: [] })),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    // Immediately call callback with mock doc data
    callback({
      data: () => ({ coins: 20 }),
    });
    return () => {}; // return unsubscribe function
  }),
}));


jest.mock('@/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('@/util/logActivity', () => ({
  logToAllGroupLogs: jest.fn(),
}));

global.alert = jest.fn();

describe('PomodoroScreen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  // 1. starts timer with correct duration
  it('starts timer with 25 minutes and sets state properly', () => {
    const { getByText } = render(<PomodoroScreen />);
    fireEvent.press(getByText('25m'));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Check that timer started and counts down
    expect(getByText(/24:5[89]/)).toBeTruthy(); // somewhere around 24:59
  });

  // 2. shows alert for sessions shorter than 5 minutes
  it('displays alert for short custom session (<5 min)', () => {
    const { getByPlaceholderText, getByText } = render(<PomodoroScreen />);
    const input = getByPlaceholderText('Enter minutes');
    fireEvent.changeText(input, '3');
    fireEvent.press(getByText('Start'));

    expect(Alert.alert).toHaveBeenCalledWith(
    'Session too short',
    'Only sessions longer than 5 minutes will be recorded and rewarded. Continue with short session?',
    expect.any(Array)
    );
  });

  // 3. switches to stopwatch mode correctly
  it('switches to stopwatch mode when button pressed', () => {
    const { getByText } = render(<PomodoroScreen />);
    const switchBtn = getByText('Switch to Stopwatch');
    fireEvent.press(switchBtn);

    expect(getByText(/stay focused/i)).toBeTruthy(); // Checks stopwatch quote shows
  });

    // 4. shows motivational quote when stopwatch is active
    it('shows quote when stopwatch is active', () => {
    const { getByText, getByTestId } = render(<PomodoroScreen />);
    fireEvent.press(getByText('Switch to Stopwatch'));

    expect(getByTestId('motivational-quote')).toBeTruthy();
    });

    // 5. Verify timer completion
    it('completes 25-minute timer and shows completion message', () => {
    const { getByText } = render(<PomodoroScreen />);
    
    fireEvent.press(getByText('25m'));
    
    act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000); // Fast-forward 25 mins
    });
    
    expect(getByText("Time's Up!")).toBeTruthy();
    });

});
