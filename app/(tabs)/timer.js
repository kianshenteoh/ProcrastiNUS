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
  const intervalRef = useRef(null);

  const quotes = ['Focus on the goal, not the clock.', 'Small steps turn into miles.', 'Your future self will thank you.', 'One Pomodoro at a time!', 'Discipline beats motivation.'];

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          Vibration.vibrate(800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const startTimer = sec => {
    setSecondsLeft(sec);
    setInitialTime(sec);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setRunning(true);
    setCustomMinutes('');
  };

  const pause = () => setRunning(false);
  const resume = () => setRunning(true);

  const giveUp = () => {
    Alert.alert(
      'Don\'t give up!',
      'If you give up now, you will only get half the time coins.',
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
    if (secondsLeft === 0 && initialTime !== 0) return "Time's Up!";
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = initialTime ? (1 - secondsLeft / initialTime) * CIRCUMFERENCE : 0;

  return (
    <View style={S.container}>
      <View style={S.timerContainer}>
        <Svg width={2 * (RADIUS + STROKE_WIDTH)} height={2 * (RADIUS + STROKE_WIDTH)}>
          <Circle stroke="#e0e0e0" cx={RADIUS + STROKE_WIDTH} cy={RADIUS + STROKE_WIDTH} r={RADIUS} strokeWidth={STROKE_WIDTH} fill="none" />
          <Circle stroke='rgb(29, 114, 89)' cx={RADIUS + STROKE_WIDTH} cy={RADIUS + STROKE_WIDTH} r={RADIUS} strokeWidth={STROKE_WIDTH + 1} fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - progress} />
        </Svg>
        <Text style={S.timerText}>{displayTime()}</Text>
      </View>

      <Text style={S.quote}>{quote}</Text>

      {!running && secondsLeft === 0 && (
        <View>
          <View style={S.row}>
            <Preset label="15m" onPress={() => startTimer(900)} />
            <Preset label="30m" onPress={() => startTimer(1800)} />
            <Preset label="1h" onPress={() => startTimer(3600)} />
          </View>
          <View style={S.customInputContainerCentered}>
            <TextInput style={S.input} keyboardType="numeric" value={customMinutes} onChangeText={setCustomMinutes} placeholder="Enter minutes" />
            <Pressable style={S.startBtn} onPress={handleCustomStart}><Text style={S.startBtnText}>Start</Text></Pressable>
          </View>
        </View>
      )}

      {secondsLeft > 0 && (
        <View style={S.row}>
          {running ? (
            <Pressable style={S.pauseBtn} onPress={pause}><FontAwesome5 name="pause" size={24} color="#fff" /></Pressable>
          ) : (
            <Pressable style={S.resumeBtn} onPress={resume}><FontAwesome5 name="play" size={24} color="#fff" /></Pressable>
          )}
          <Pressable style={S.resetBtn} onPress={giveUp}><FontAwesome5 name="times" size={28} color="#fff" /></Pressable>
        </View>
      )}
    </View>
  );
}

function Preset({ label, onPress }) {
  return (<Pressable style={S.presetBtn} onPress={onPress}><Text style={S.presetTxt}>{label}</Text></Pressable>);
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(29, 114, 89)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerContainer: { justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 20 },
  timerText: { fontSize: 84, fontWeight: '700', color: '#fff', position: 'absolute' },
  quote: { fontSize: 32, color: '#fff', marginVertical: 30, textAlign: 'center', maxWidth: '90%' },
  row: { flexDirection: 'row', marginVertical: 12, flexWrap: 'wrap', justifyContent: 'center' },
  presetBtn: { backgroundColor: '#FFA07A', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, margin: 6 },
  presetTxt: { color: '#fff', fontWeight: '700', fontSize: 18 },
  pauseBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22, marginRight: 30 },
  resumeBtn: { backgroundColor: '#32CD32', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22, marginRight: 30 },
  resetBtn: { backgroundColor: '#e74c3c', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 22 },
  customInputContainerCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 10, padding: 12, width: 120, marginRight: 12, backgroundColor: '#fff', fontSize: 16 },
  startBtn: { backgroundColor: '#27ae60', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  startBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
