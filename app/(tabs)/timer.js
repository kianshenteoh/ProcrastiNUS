import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RADIUS = 120;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroScreen() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [quote, setQuote] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [initialTime, setInitialTime] = useState(0);
  const [mode, setMode] = useState('timer');
  const [elapsed, setElapsed] = useState(0);
  const [resetTimer, setResetTimer] = useState(null);
  const [resetCountdown, setResetCountdown] = useState(180);
  const intervalRef = useRef(null);

  const quotes = [
  "Stay focused—your future self is watching with popcorn.",
  "Brains in gear, distractions in the trunk.",
  "You’re just one Pomodoro away from world domination (or at least finishing that assignment).",
  "Study like you’re trying to impress your future boss… or crush.",
  "The coffee’s strong, but your focus is stronger.",
  "Every tick is a step closer to freedom (or snacks).",
  "Work now, flex later.",
  "You can do anything for 25 minutes. Even this.",
  "Be the main character in your study montage.",
  "Focus like your GPA depends on it. (It probably does.)",
  "This Pomodoro is sponsored by sheer willpower and questionable caffeine intake.",
  "Don't scroll. Your pet is watching.",
  "You’re not procrastinating, you’re pre-successing.",
  "Discipline: because motivation slept in today.",
  "Get that First Class Honours.",
  "Uni is tough, but you are tougher."
];


  useEffect(() => {
    if (!running) return;
    if (mode === 'stopwatch' && resetTimer) {
      clearTimeout(resetTimer);
      setResetTimer(null);
      clearInterval(resetCountdownIntervalRef.current);
      setResetCountdown(180);
    }
    

    intervalRef.current = setInterval(() => {
      if (mode === 'timer') {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          Vibration.vibrate(800);
          return 0;
        }
        return prev - 1;
      });
    } else {
      setElapsed(prev => prev + 1);
    }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const startTimer = sec => {
    setSecondsLeft(sec);
    setInitialTime(sec);
    getRandomQuote();
    setRunning(true);
    setCustomMinutes('');
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  };

  const pause = () => setRunning(false);
  const resume = () => setRunning(true);

  const giveUp = () => {
    Alert.alert(
      'Don\'t Give Up!',
      'If you give up now, you will only get half the time coins (based on elapsed time).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Give Up', style: 'destructive', onPress: () => {
            setRunning(false);
            setSecondsLeft(0);
            setInitialTime(0);
          }
        },
      ]
    );
  };

  const handleCustomStart = () => {
    const m = parseInt(customMinutes, 10);
    if (!isNaN(m) && m > 0) startTimer(m * 60);
  };

  const displayTime = () => {
    const time = mode === 'timer' ? secondsLeft : elapsed;
    if (time === 0 && mode === 'timer' && initialTime !== 0) return "Time's Up!";
    const m = String(Math.floor(time / 60)).padStart(2, '0');
    const s = String(time % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const resetCountdownIntervalRef = useRef(null);
  const handleStopwatchStop = () => {
  setRunning(false);
  if (resetCountdownIntervalRef.current) {
    clearInterval(resetCountdownIntervalRef.current);
    resetCountdownIntervalRef.current = null;
  }

  setResetCountdown(180);
  resetCountdownIntervalRef.current = setInterval(() => {
    setResetCountdown(prev => {
      if (prev <= 1) {
        clearInterval(resetCountdownIntervalRef.current);
        resetCountdownIntervalRef.current = null;
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  const timeoutId = setTimeout(() => {
    setElapsed(0);
    setResetCountdown(180);
    setResetTimer(null);
    if (resetCountdownIntervalRef.current) {
      clearInterval(resetCountdownIntervalRef.current);
      resetCountdownIntervalRef.current = null;
    }
  }, 180000); 

  setResetTimer(timeoutId);
};

  const handleManualReset = () => {
  setRunning(false);
  clearInterval(intervalRef.current);

  if (resetTimer) {
    clearTimeout(resetTimer); 
    setResetTimer(null);
  }

  if (resetCountdownIntervalRef.current) {
    clearInterval(resetCountdownIntervalRef.current);
    resetCountdownIntervalRef.current = null;
  }
  setElapsed(0);
  setResetCountdown(180);
};

  const progress = mode === 'timer' && initialTime ? (1 - secondsLeft / initialTime) * CIRCUMFERENCE : 0;

  return (
    <View style={styles.container}>
    
    <Pressable
  onPress={() => {
    setRunning(false); // pause current mode before switching
    setMode(prev => (prev === 'timer' ? 'stopwatch' : 'timer'));
  }}
  disabled={running}
  style={{
    backgroundColor: running ? '#ccc' : '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    opacity: running ? 0.6 : 1,
  }}
>
  <Text style={{ fontWeight: 'bold', color: 'rgb(29, 114, 89)' }}>
    Switch to {mode === 'timer' ? 'Stopwatch' : 'Timer'}
  </Text>
</Pressable>



    <View style={styles.studyRow}>
        <IconText icon="hourglass-half" text={`12.5h`} color="rgb(46, 192, 245)" header="  Week" />
        <IconText icon="clock" text={`240h`} color="#f59e0b" header="  Total" />
    </View>

      <View style={styles.timerContainer}>
        <Svg width={2 * (RADIUS + STROKE_WIDTH)} height={2 * (RADIUS + STROKE_WIDTH)}>
          <Circle stroke="#e0e0e0" cx={RADIUS + STROKE_WIDTH} cy={RADIUS + STROKE_WIDTH} r={RADIUS} strokeWidth={STROKE_WIDTH} fill="none" />
          <Circle stroke='rgb(29, 114, 89)' cx={RADIUS + STROKE_WIDTH} cy={RADIUS + STROKE_WIDTH} r={RADIUS} strokeWidth={STROKE_WIDTH + 1} fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - progress} />
        </Svg>
        <Text style={styles.timerText}>{displayTime()}</Text>
      </View>

      <Text style={styles.quote}>
        {mode === 'stopwatch' && running
          ? quote
          : mode === 'stopwatch' && !running && resetTimer
            ? `${Math.floor(resetCountdown / 60)} minutes and ${resetCountdown % 60} seconds until stopwatch resets`
            : mode === 'stopwatch'
              ? "Start the stopwatch and stay focused!"
              : initialTime === 0
                ? "Start the timer and put down your phone!"
                : quote}
      </Text>

      {mode === 'timer' && !running && secondsLeft === 0 && (
        <View>
          <View style={styles.row}>
            <Preset label="15m" onPress={() => startTimer(900)} />
            <Preset label="30m" onPress={() => startTimer(1800)} />
            <Preset label="60m" onPress={() => startTimer(3600)} />
          </View>
          <View style={styles.customInputContainer}>
            <TextInput style={styles.input} placeholderTextColor="#fff" keyboardType="numeric" value={customMinutes} onChangeText={setCustomMinutes} placeholder="Enter minutes" />
            <Pressable style={styles.startBtn} onPress={handleCustomStart}><Text style={styles.startBtnText}>Start</Text></Pressable>
          </View>
        </View>
      )}

      {mode === 'stopwatch' && (
        <View style = {{flexDirection: 'row', justifyContent: 'center', gap: 10}}>
          {running ? (
            <Pressable style = {styles.resetBtn} onPress = {handleStopwatchStop}>
               <FontAwesome5 name="stop" size={24} color="#fff" />
            </Pressable>
          ): (
            <>
            <Pressable style = {styles.startBtn} onPress = {() => { 
              getRandomQuote();
              setRunning(true)}}>
              <FontAwesome5 name="play" size={24} color="#fff" />
            </Pressable>
            <Pressable 
              style = {[ styles.resetBtn, elapsed === 0 && {backgroundColor: '#ccc'},]}
                onPress = {handleManualReset}
                disabled = {elapsed === 0}>
                  <FontAwesome5 name="redo" size={24} color="#fff" />
              </Pressable>
            </>
          )}
        </View>
      )}

      {mode === 'timer' && secondsLeft > 0 && (
        <View style={styles.row}>
          {running ? (
            <Pressable style={styles.pauseBtn} onPress={pause}><FontAwesome5 name="pause" size={24} color="#fff" /></Pressable>
          ) : (
            <Pressable style={styles.resumeBtn} onPress={resume}><FontAwesome5 name="play" size={24} color="#fff" /></Pressable>
          )}
          <Pressable style={styles.resetBtn} onPress={giveUp}><FontAwesome5 name="times" size={28} color="#fff" /></Pressable>
        </View>
      )}
    </View>
  );
}

function Preset({ label, onPress }) {
  return (<Pressable style={styles.presetBtn} onPress={onPress}><Text style={styles.presetTxt}>{label}</Text></Pressable>);
}

function IconText({ icon, color, text, header }) {
  return (
    <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 25 }}>
            <FontAwesome5 name={icon} size={18} color={color} style={{ marginRight: 6 }} />
            <Text style={{ color, fontWeight: '700' }}>{text}</Text>
        </View>
        <Text style={[styles.studyLbl, {color: color}]}>{header}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(29, 114, 89)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerContainer: { justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 0 },
  timerText: { fontSize: 70, fontWeight: '700', color: '#fff', position: 'absolute' },
  quote: { fontSize: 18, color: '#fff', marginTop: 30, marginBottom: 35, textAlign: 'center', maxWidth: '90%' },
  row: { flexDirection: 'row', marginVertical: 12, flexWrap: 'wrap', justifyContent: 'center' },
  presetBtn: { backgroundColor: 'rgb(72, 175, 248)', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, margin: 6 },
  presetTxt: { color: '#fff', fontWeight: '700', fontSize: 18 },
  pauseBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22, marginRight: 30 },
  resumeBtn: { backgroundColor: '#32CD32', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22, marginRight: 30 },
  resetBtn: { backgroundColor: '#e74c3c', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22 },
  customInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  input: { color: '#fff', borderColor: '#fff', borderWidth: 2, borderRadius: 10, padding: 9, width: 155, marginRight: 14, backgroundColor: 'rgb(29, 114, 89)', fontSize: 16 },
  startBtn: { backgroundColor: '#27ae60', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  startBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  studyRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 40 },
  studyLbl: { fontSize:10, color: '#fff', marginHorizontal: 5, textAlign: 'center' },
});
