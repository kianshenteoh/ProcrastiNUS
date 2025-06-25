import { useRoute } from '@react-navigation/native';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../firebase';
import { academicYears, getAcademicYear } from './academicYears';



const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM–8PM
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
  const [weekLabel, setWeekLabel] = useState('');
  const [importSemester, setImportSemester] = useState(1);
  const ay = academicYears[getAcademicYear(new Date())];
  const defaultDate = ay?.sem1?.start ?? new Date();
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const currentAcademicYear = getAcademicYear(defaultDate);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentAcademicYear);
  const [activeSemester, setActiveSemester] = useState(1);
  const route = useRoute();

  useEffect(() => {
    if (route.params?.refresh) {
      loadUserTasks();
    }
  }, [route.params?.refresh]);
  
  useEffect(() => {
    setSemester(1);
    setWeekLabel(getAcademicWeekLabel(defaultDate, currentAcademicYear));
    setCurrentWeek(getAcademicWeekFromDate(defaultDate));
  }, []);

  useEffect(() => {
  
  const weekType = getAcademicWeekLabel(selectedDate, selectedAcademicYear);
  setWeekLabel(weekType);
  const ay = academicYears[selectedAcademicYear];
  const isSemester1 = selectedDate >= ay.sem1.start && selectedDate <= ay.sem1.end;
  const isSemester2 = selectedDate >= ay.sem2.start && selectedDate <= ay.sem2.end;
  
  // Filter class events based on current semester
  const filteredClassEvents = allClassEvents.filter(event => {
    if (!isSemester1 && !isSemester2) return false;
    
    // Check if the event belongs to the current semester
    const eventSemester = event.semester ?? (semester || 1);
    
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
    if (!event.date) return false;
    const eventDate = new Date(event.date);

    // Find Monday of the selected week
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return eventDate >= monday && eventDate <= sunday;
  });

  setEvents([...filteredClassEvents, ...filteredTaskEvents]);
}, [selectedDate, allClassEvents, allTaskEvents, semester, selectedAcademicYear]);

  const [currentWeek, setCurrentWeek] = useState(1);

  const getAcademicWeekFromDate = (date) => {
    const ayKey = getAcademicYear(date);
    const ay = academicYears[ayKey];
    if (!ay) return 1;

    if (date >= ay.sem1.start && date <= ay.sem1.end) {
      const diffDays = Math.floor((date - ay.sem1.start) / (1000 * 60 * 60 * 24));
      return Math.floor(diffDays / 7) + 1;
    }

    if (date >= ay.sem2.start && date <= ay.sem2.end) {
      const diffDays = Math.floor((date - ay.sem2.start) / (1000 * 60 * 60 * 24));
      return Math.floor(diffDays / 7) + 1;
    }

    return 1;
  };


  const getAcademicWeekLabel = (date, academicYearKey) => {
    const ay = academicYears[academicYearKey];
    if (!ay) return 'Unsupported Academic Year';

    const isBetween = (target, start, end) => target >= start && target <= end;

    // Check Recess and Reading weeks first
    if (isBetween(date, ay.sem1.recessStart, ay.sem1.recessEnd)) return 'Recess Week';
    if (isBetween(date, ay.sem1.readingStart, ay.sem1.readingEnd)) return 'Reading Week';
    if (isBetween(date, ay.sem2.recessStart, ay.sem2.recessEnd)) return 'Recess Week';
    if (isBetween(date, ay.sem2.readingStart, ay.sem2.readingEnd)) return 'Reading Week';

    // Then check Semester 1 and 2
    if (isBetween(date, ay.sem1.start, ay.sem1.end)) {
      const diffDays = Math.floor((date - ay.sem1.start) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return `Week ${week}`;
    }

    if (isBetween(date, ay.sem2.start, ay.sem2.end)) {
      const diffDays = Math.floor((date - ay.sem2.start) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return `Week ${week}`;
    }

    return 'Vacation';
  };

  const loadUserTasks = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userEvents = snapshot.docs.map(doc => {
        const task = doc.data();
        if (!task.dueDate || task.completed) return null; 
        const date = task.dueDate.toDate();
        const dayIndex = (date.getDay() + 6) % 7;
        const dayName = DAYS[dayIndex];
        if (!dayName) return null;

        return {
          title: `📝 ${task.title}`,
          day: dayName,
          startHour: date.getHours(),
          endHour: date.getHours() + 1,
          date: date,
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

  const fetchModuleLessons = async (code, classSelections, semester, academicYearKey) => {
    try {
      const nusmodsYear = academicYearKey.replace('AY', '').replace('/', '-');
      const res = await fetch(`https://api.nusmods.com/v2/${nusmodsYear}/modules/${code}.json`);
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
            semester,
          };
        })
        .filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch module lessons:', err);
      return [];
    }
  };

  const importNUSModsURL = async () => {
    const { modules, semester: semFromUrl } = parseNUSModsURL(nusmodsUrl);

    const academicYearKey = 'AY2024/2025'; // ← customize year here
    const ay = academicYears[academicYearKey];
    if (!ay) {
      Alert.alert('Error', 'Academic year not found');
      return;
    }

    const targetSemester = semFromUrl || 1;
    const initialDate = targetSemester === 1 ? ay.sem1.start : ay.sem2.start;

    // Set all state BEFORE fetching, and use local vars for fetch
    setSemester(targetSemester);
    setActiveSemester(targetSemester);
    setSelectedAcademicYear(academicYearKey);
    setSelectedDate(initialDate);
    setWeekLabel(getAcademicWeekLabel(initialDate, academicYearKey));
    setCurrentWeek(getAcademicWeekFromDate(initialDate));

    const lessonsByModule = await Promise.all(
      modules.map(({ code, classSelections }) =>
        fetchModuleLessons(code, classSelections, targetSemester, academicYearKey)
      )
    );

    const flatLessons = lessonsByModule.flat();
    setAllClassEvents(flatLessons);
  };



  const renderDayRow = (day, index, weekStartDate) => {
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
      
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
      
    const formattedDate = dayDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
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

  const renderTimeLabels = () => (
    <View style={styles.timeRow}>
      <View style={styles.dayHeaderCell}>
        <Text style={styles.dayHeaderText}>Day</Text>
      </View>
      {HOURS.map(hour => (
        <View key={hour} style={styles.timeSlot}>
          <Text style={styles.timeText}>{hour}:00</Text>
        </View>
      ))}
    </View>
  );

  const handleSemesterChange = (sem) => {
    setActiveSemester(sem);
    setSemester(sem);
    const ay = academicYears[currentAcademicYear];
    const initialDate = sem === 1 ? ay.sem1.start : ay.sem2.start;
    setSelectedDate(initialDate);
    setWeekLabel(`Semester ${sem}`);
    setCurrentWeek(1);
  };



  return (
    <View style={{ flex: 1 }}>
    <View style={styles.semesterToggle}>
      <Text style={styles.semesterToggleTitle}>Select Semester</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Semester 1" onPress={() => handleSemesterChange(1)} color={activeSemester === 1 ? '#007AFF' : '#ccc'} />
        <Button title="Semester 2" onPress={() => handleSemesterChange(2)} color={activeSemester === 2 ? '#007AFF' : '#ccc'} />
      </View>
    </View>
   
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
          <Button
            title="←"
            onPress={() => {
              if (!selectedAcademicYear || ![1, 2].includes(activeSemester)) return;

              const semKey = `sem${activeSemester}`;
              const range = academicYears[selectedAcademicYear]?.[semKey];
              if (!range || !range.start || !range.end) return;

              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 7);

              if (newDate >= new Date(range.start)) {
                setSelectedDate(newDate);
              }
            }}
          />

          <Text style={styles.weekText}>{weekLabel}</Text>
          <Button
            title="→"
            onPress={() => {
              if (!selectedAcademicYear || ![1, 2].includes(activeSemester)) return;

              const semKey = `sem${activeSemester}`;
              const range = academicYears[selectedAcademicYear]?.[semKey];
              if (!range || !range.start || !range.end) return;

              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 7);

              if (newDate <= new Date(range.end)) {
                setSelectedDate(newDate);
              }
            }}
          />
        </View>
      </View>

      <ScrollView style={styles.container}>
        <ScrollView horizontal>
          <View>
            {renderTimeLabels()}
            {DAYS.map((day, idx) => renderDayRow(day, idx))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
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
  weekText: { fontSize: 16, fontWeight: '600', textAlign: 'center', flex: 1 }, semesterSelectContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,},
  semesterSelectTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, },
  semesterToggle: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', alignItems: 'center', },
  semesterToggleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6,},
});