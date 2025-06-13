import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { auth } from '../firebase';

export default function SettingsScreen() {
  const router = useRouter();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [showStudyTips, setShowStudyTips] = useState(true);
  const [syncWithCalendar, setSyncWithCalendar] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (err) {
      console.error(err);
      Alert.alert('Logout failed', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.row}><Text style={styles.label}>Dark Theme</Text><Switch value={isDarkTheme} onValueChange={setIsDarkTheme} /></View>
      <View style={styles.row}><Text style={styles.label}>Notifications</Text><Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} /></View>
      <View style={styles.row}><Text style={styles.label}>Sync with Calendar</Text><Switch value={syncWithCalendar} onValueChange={setSyncWithCalendar} /></View>

      <Pressable style={styles.button} onPress={() => router.push('/focus-settings')}><Text style={styles.buttonText}>Focus Mode Settings</Text></Pressable>
      <Pressable style={styles.button} onPress={() => router.push('/about')}><Text style={styles.buttonText}>About This App</Text></Pressable>
      <Pressable style={[styles.button, styles.dangerButton]} onPress={handleLogout}><Text style={styles.buttonText}>Log Out</Text></Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 ProcrastiNUS v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: { fontSize: 16 },
  button: {
    backgroundColor: '#4b7bec',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  dangerButton: { backgroundColor: '#ff3b30' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#aaa' },
});
