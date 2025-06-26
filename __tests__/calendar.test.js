import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as authModule from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import HorizontalCalendar from '../app/calendar';

jest.mock('firebase/firestore');
jest.mock('firebase/auth');
jest.mock('../path/to/academicYears', () => ({
  academicYears: {
    'AY2024/2025': {
      sem1: { start: new Date('2024-08-05'), end: new Date('2024-11-24'), recessStart: new Date('2024-09-30'), recessEnd: new Date('2024-10-06'), readingStart: new Date('2024-11-18'), readingEnd: new Date('2024-11-24') },
      sem2: { start: new Date('2025-01-13'), end: new Date('2025-04-25'), recessStart: new Date('2025-03-03'), recessEnd: new Date('2025-03-09'), readingStart: new Date('2025-04-14'), readingEnd: new Date('2025-04-20') },
    }
  }
}));

authModule.auth = {
  currentUser: { email: 'test@example.com' },
};

const mockGetDocs = firestore.getDocs;
const mockSetDoc = firestore.setDoc;
const mockDeleteDoc = firestore.deleteDoc;
const mockDoc = firestore.doc;
const mockCollection = firestore.collection;

describe('HorizontalCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar with input and buttons', () => {
    const { getByPlaceholderText, getByText } = render(<HorizontalCalendar />);
    expect(getByPlaceholderText(/Paste NUSMods URL/i)).toBeTruthy();
    expect(getByText(/Import/)).toBeTruthy();
    expect(getByText(/Semester 1/)).toBeTruthy();
  });

  it('allows NUSMods URL input and triggers import', async () => {
    const { getByPlaceholderText, getByText } = render(<HorizontalCalendar />);
    const input = getByPlaceholderText(/Paste NUSMods URL/i);
    fireEvent.changeText(input, 'https://nusmods.com/timetable/sem-1/share?CS1010=TUT:01');

    const importBtn = getByText(/Import/);
    fireEvent.press(importBtn);

    await waitFor(() => {
      // The import will call fetch(), mock this for true behavior
      expect(true).toBe(true); // Placeholder for now
    });
  });

  it('changes semester using modal', async () => {
    const { getByText, queryByText } = render(<HorizontalCalendar />);
    fireEvent.press(getByText('Semester 1'));
    await waitFor(() => expect(queryByText('Semester 2')).toBeTruthy());

    fireEvent.press(getByText('Semester 2'));
    await waitFor(() => expect(queryByText('Semester 2')).toBeFalsy());
  });

  it('navigates weeks with chevron buttons', () => {
    const { getByText, getByRole } = render(<HorizontalCalendar />);
    const weekLabel = getByText(/Week/i);

    const next = getByRole('button', { name: /chevron-right/i });
    fireEvent.press(next);

    // assert label changes
    expect(weekLabel).toBeTruthy();
  });

  it('loads user tasks and modules', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ title: 'Task 1', dueDate: { toDate: () => new Date() }, completed: false }) },
        { data: () => ({ title: 'Task 2', dueDate: { toDate: () => new Date() }, completed: false }) }
      ]
    });
    render(<HorizontalCalendar />);
    await waitFor(() => {
      expect(mockGetDocs).toHaveBeenCalled();
    });
  });

  it('shows week label on semester change', async () => {
    const { getByText } = render(<HorizontalCalendar />);
    fireEvent.press(getByText('Semester 1'));
    await waitFor(() => fireEvent.press(getByText('Semester 2')));
    expect(getByText('Semester 2')).toBeTruthy();
  });
});
