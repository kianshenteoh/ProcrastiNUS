import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { auth, db } from '../firebase';
import { getAcademicYear } from './academicYears';


const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM–8PM
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 100;

const colorPalette = [
  '#f4a261', // orange
  '#f28482', // red
  '#b5c99a', // green
  '#38b6ff', // blue
  '#dab785', // tan
  '#a5d8ff', // light blue
  '#c492f0', // purple
];
const moduleColorMap = {};
let moduleColorIndex = 0;

const lessonTypeAbbreviations = {
  Lecture: 'LEC',
  Tutorial: 'TUT',
  Laboratory: 'LAB',
  'Sectional Teaching': 'SEC',
  Recitation: 'REC',
  Workshop: 'WS',
};

export default function HorizontalCalendar() {
  const [events, setEvents] = useState([]);
  const [nusmodsUrl, setNusmodsUrl] = useState('');
  const [semester, setSemester] = useState(null)
  const [allClassEvents, setAllClassEvents] = useState([]);
  const [allTaskEvents, setAllTaskEvents] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
  loadUserTasks();
  
  const weekType = getAcademicWeekLabel(selectedDate);
  const isSemester1 = weekType.includes('Semester 1');
  const isSemester2 = weekType.includes('Semester 2');
  
  // Filter class events based on current semester
  const filteredClassEvents = allClassEvents.filter(event => {
    if (!isSemester1 && !isSemester2) return false;
    
    // Check if the event belongs to the current semester
    const eventSemester = event.weeks ? 
      (event.weeks.some(w => w <= 13) ? 1 : 2) : 
      (semester || 1); // Fallback to URL semester or default
    
    if ((isSemester1 && eventSemester !== 1) || 
        (isSemester2 && eventSemester !== 2)) {
      return false;
    }
    
    // Check week if in semester
    const weekMatch = weekType.match(/Week (\d+)/);
    return weekMatch ? 
      (Array.isArray(event.weeks) ? event.weeks.includes(parseInt(weekMatch[1], 10)) : true) : 
      false;
  });

  // Filter task events for current week
  const filteredTaskEvents = allTaskEvents.filter(event => {
    if (!event.date) return true;
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  setEvents([...filteredClassEvents, ...filteredTaskEvents]);
}, [selectedDate, allClassEvents, allTaskEvents, semester]);

  const getFirstMonday = (year) => {
    const date = new Date(year, 0, 1);
    while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
    }
    return date;
  };

  const getCurrentAcademicWeek = () => {
    const now = new Date();
    const firstMonday = getFirstMonday(now.getFullYear());
    const diffDays = Math.floor((now - firstMonday) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };
  const [currentWeek, setCurrentWeek] = useState(getCurrentAcademicWeek());

  const getAcademicWeekFromDate = (date) => {
    const firstMonday = getFirstMonday(date.getFullYear());
    const diffDays = Math.floor((date - firstMonday) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  const firstMonday = getFirstMonday(selectedDate.getFullYear());
  const weekStartDate = new Date(firstMonday);
  weekStartDate.setDate(firstMonday.getDate() + (currentWeek - 1) * 7);

  const getAcademicWeekLabel = (date) => {
    const ay = getAcademicYear(date);
    if (!ay) return 'Unsupported Academic Year';

    const isBetween = (target, start, end) => target >= start && target <= end;

    // Check Semester 1 periods first
    if (isBetween(date, ay.sem1.start, ay.sem1.end)) {
      const diffDays = Math.floor((date - ay.sem1.start) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return `Semester 1 Week ${week}`;
    }

    // Check Semester 2 periods
    if (isBetween(date, ay.sem2.start, ay.sem2.end)) {
      const diffDays = Math.floor((date - ay.sem2.start) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return `Semester 2 Week ${week}`;
    }

    // Check other periods
    if (isBetween(date, ay.sem1.recessStart, ay.sem1.recessEnd)) return 'Recess Week';
    if (isBetween(date, ay.sem1.readingStart, ay.sem1.readingEnd)) return 'Reading Week';
    if (isBetween(date, ay.sem2.recessStart, ay.sem2.recessEnd)) return 'Recess Week';
    if (isBetween(date, ay.sem2.readingStart, ay.sem2.readingEnd)) return 'Reading Week';

    return 'Vacation';
  };
  const [weekLabel, setWeekLabel] = useState(getAcademicWeekLabel(new Date()));


  const loadUserTasks = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userEvents = snapshot.docs.map(doc => {
        const task = doc.data();
        if (!task.dueDate) return null;
        const date = task.dueDate.toDate();
        const dayName = DAYS[date.getDay()];
        if (!dayName) return null;

    return {
        title: `📝 ${task.title}`,
        day: dayName,
        startHour: date.getHours(),
        endHour: date.getHours() + 1,
        date: date, // ✅ this is critical
        color: '#84dcc6'
    };
    }).filter(Boolean);
    
    setAllTaskEvents(userEvents);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const parseNUSModsURL = (url) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname; 
      const semMatch = pathname.match(/sem-(\d)/i);
      const semester = semMatch ? parseInt(semMatch[1], 10) : 1;

      const params = parsed.searchParams;
      const modules = [];
      for (const [code, selections] of params.entries()) {
        modules.push({ code, classSelections: selections.split(',') });
      }
      return { modules, semester };
    } catch {
      Alert.alert('Invalid URL');
      return { modules: [], semester: 1 };
    }
  };

  const formatWeeks = (weeks) => {
    if (!Array.isArray(weeks)) return '';
    if (weeks.length === 0) return 'N/A';

    const ranges = [];
    let start = weeks[0];
    let end = weeks[0];

    for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] === end + 1) {
        end = weeks[i];
        } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = weeks[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
  };

  const fetchModuleLessons = async (code, classSelections, semester) => {
    try {
      const res = await fetch(`https://api.nusmods.com/v2/2024-2025/modules/${code}.json`);
      if (!res.ok) {
        console.error('Module not found:', code);
        return [];
      }
      const data = await res.json();
      const semData = data.semesterData.find(s => s.semester === semester);
      const lessons = semData?.timetable || [];
      const parseTime = (timeStr) => {
        const h = parseInt(timeStr.slice(0, 2), 10);
        const m = parseInt(timeStr.slice(2), 10);
        return h + m / 60;
      };
      const normalizedSelections = classSelections.map(s => {
        const [type, num] = s.split(':');
        return `${type}:${num}`;
    });
      const lessonColor = moduleColorMap[code] || (moduleColorMap[code] = colorPalette[moduleColorIndex++ % colorPalette.length]);

      return lessons
        .filter(lesson => {
            const abbr = lessonTypeAbbreviations[lesson.lessonType];
            const matchKey = `${abbr}:${lesson.classNo}`;
              return abbr && normalizedSelections.includes(matchKey);
        })
        .map(lesson => {
          const day = lesson.day;
          return {
            title: `${code} ${lesson.lessonType}`,
            day,
            startHour: parseTime(lesson.startTime),
            endHour: parseTime(lesson.endTime),
            location: lesson.venue,
            weeks: lesson.weeks,
            lessonType: lesson.lessonType,
            color: lessonColor,
          };
        })
        .filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch module lessons:', err);
      return [];
    }
  };

  const importNUSModsURL = async () => {
    const { modules, semester: semesterFromUrl } = parseNUSModsURL(nusmodsUrl);
    setSemester(semesterFromUrl); // Store the semester
    
    // Get the current academic year
    const ay = getAcademicYear(new Date());
    
    // Set the initial date based on the semester from URL
    const initialDate = semesterFromUrl === 1 ? ay.sem1.start : ay.sem2.start;
    setSelectedDate(initialDate);
    
    // Update week label and current week
    setWeekLabel(getAcademicWeekLabel(initialDate));
    setCurrentWeek(1); // Start at week 1 for the semester

    // Fetch and set class events
    const lessonsByModule = await Promise.all(
      modules.map(({ code, classSelections }) =>
        fetchModuleLessons(code, classSelections, semesterFromUrl)
      )
    );
    setAllClassEvents(lessonsByModule.flat());
  };

  const renderTimeLabels = () => (
    <View style={styles.timeRow}>
      <View style={styles.dayHeaderCell}><Text style={styles.dayHeaderText}>Day</Text></View>
      {HOURS.map(hour => (
        <View key={hour} style={styles.timeSlot}>
          <Text style={styles.timeText}>{hour}:00</Text>
        </View>
      ))}
    </View>
  );

  const renderDayRow = (day, index, weekStartDate) => {
  const dayDate = new Date(weekStartDate);
  dayDate.setDate(weekStartDate.getDate() + ((index - 1) % 7));
  const formattedDate = dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'});
  const dayEvents = events
    .filter(e => e.day === day)
    .sort((a, b) => a.startHour - b.startHour);

  const lanes = [];
  for (const event of dayEvents) {
    let placed = false;
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (last.endHour <= event.startHour) {
        lane.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([event]);
    }
  }

  const rowHeight = Math.max(lanes.length, 1) * 70;
  return (
    <View style={[styles.dayRow, { height: rowHeight }]} key={day}>
      <View style={styles.dayLabel}>
        <Text style={styles.dayLabelText}>{day}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      <View style={styles.dayEventsContainer}>
        {lanes.map((lane, laneIndex) =>
          lane.map((event, i) => {
            const left = (event.startHour - 8) * HOUR_WIDTH;
            const width = (event.endHour - event.startHour) * HOUR_WIDTH;
            const laneGap = 4; // space between blocks
            const blockHeight = 60;
            const topOffset = laneIndex * (blockHeight + laneGap);
            return (
              <View
                key={`${day}-${laneIndex}-${i}`}
                style={[
                  styles.eventBlock,
                  {
                    left,
                    width,
                    top: topOffset,
                    backgroundColor: event.color,
                  },
                ]}>
                <Text style={styles.eventText}>{event.title}</Text>
                {event.location && (
                  <Text style={styles.eventSubText}>{event.location}</Text>
                )}
                {event.weeks && (
                  <Text style={styles.eventSubText}>Weeks: {formatWeeks(event.weeks)}</Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};


  return (
    <View style={{ flex: 1 }}>
      <View style={styles.inputRow}>
        <TextInput
          value={nusmodsUrl}
          onChangeText={setNusmodsUrl}
          placeholder="Paste NUSMods URL here (Not the shortened one!)"
          style={styles.input}
        />
        <Button title="Import" onPress={importNUSModsURL} />
      </View>

    <View style={styles.weekControls}>
      <View style={styles.navigationRow}>
        <Button title="←" onPress={() => {
          setCurrentWeek(w => {
            const newWeek = Math.max(1, w - 1);
            const newDate = new Date(firstMonday);
            newDate.setDate(firstMonday.getDate() + (newWeek - 1) * 7);
            setSelectedDate(newDate);
            setWeekLabel(getAcademicWeekLabel(newDate));
            return newWeek;
          });
        }} />
        <Text style={styles.weekText}>{weekLabel}</Text>
        <Button title="→" onPress={() => {
          setCurrentWeek(w => {
            const newWeek = w + 1;
            const newDate = new Date(firstMonday);
            newDate.setDate(firstMonday.getDate() + (newWeek - 1) * 7);
            setSelectedDate(newDate);
            setWeekLabel(getAcademicWeekLabel(newDate));
            return newWeek;
          });
        }} />
      </View>

      <View style={styles.datePickerRow}>
        <Button title="Pick Date" onPress={() => setShowPicker(true)} />
      </View>

      {showPicker && (
        <DatePicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          mode="date"
          modal
          open={showPicker}
          onConfirm={(date) => {
            setShowPicker(false);
            setSelectedDate(date);
            setCurrentWeek(getAcademicWeekFromDate(date));
            setWeekLabel(getAcademicWeekLabel(date));
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </View>

      <ScrollView style={styles.container}>
  <ScrollView horizontal>
    <View>
      {renderTimeLabels()}
      {DAYS.map((day, idx) => renderDayRow(day, idx, weekStartDate))}
    </View>
  </ScrollView>
</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  timeRow: { flexDirection: 'row', height: 40 },
  timeSlot: { width: HOUR_WIDTH, justifyContent: 'center', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#555' },
  dayRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', overflow: 'hidden', position: 'relative', marginBottom: 8 },
  dayLabel: { width: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  dayLabelText: { fontWeight: '600' },
  dayEventsContainer: { flex: 1, position: 'relative', width: HOURS.length * HOUR_WIDTH, paddingBottom: 8 },
  eventBlock: { position: 'absolute', borderRadius: 6, justifyContent: 'flex-start', 
    paddingHorizontal: 6, paddingVertical: 0, overflow: 'hidden', minHeight: 60, width: 'auto'},
  eventText: { fontSize: 12, color: '#fff', fontWeight: '600', flexWrap: 'wrap' },
  dayHeaderCell: { width: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  dayHeaderText: { fontWeight: '700', fontSize: 12 },
  inputRow: { flexDirection: 'row', padding: 10 },
  input: { fontSize: 12, flex: 1, borderWidth: 1, borderColor: '#ccc', marginRight: 10, padding: 8, borderRadius: 6 },
  eventSubText: { fontSize: 10, color: '#fff', opacity: 0.9, flexWrap: 'wrap'},
  weekRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 10},
  weekText: {fontSize: 16, fontWeight: '600', paddingHorizontal: 10},
  verticalScroll: { flexGrow: 1, paddingBottom: 100 },
  weekInput: { width: 80, marginLeft: 10, borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6, textAlign: 'center'},
  weekControls: { alignItems: 'center', marginBottom: 10 },
  navigationRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 300,  paddingHorizontal: 10},
  weekText: { fontSize: 16, fontWeight: '600', textAlign: 'center', flex: 1 },
  datePickerRow: { marginTop: 8 }
});