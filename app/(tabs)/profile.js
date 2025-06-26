import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const nav = useNavigation();

  const user = {
    name: 'Teoh Kian Shen',
    avatar: 'https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_16x9.jpg?w=1200',
    level: 7,
    xp: 3800,
    xpToNext: 5000,
    studyHours: 124,
    tasksCompleted: 58,
    rank: 14,
    badges: [
      { id: 'b1', icon: 'medal', label: 'First 10 hrs' },
      { id: 'b2', icon: 'fire', label: '7-day Streak' },
      { id: 'b3', icon: 'award', label: 'Task Master' },
      { id: 'b4', icon: 'user-friends', label: 'Study Buddy' },
    ],
  };

  const xpPercent = user.xp / user.xpToNext;

  const showBadge = ({ item }) => (
    <View style={styles.badgeWrapper}>
      <FontAwesome5 name={item.icon} size={24} color="#f4b400" />
      <Text style={styles.badgeLabel}>{item.label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.settingsBtn} onPress={() => nav.navigate('settings')}>
          <Ionicons name="settings-sharp" size={24} color="#555" />
        </Pressable>
      </View>

      <View style={styles.topSection}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.displayName}>{user.name}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Study hrs" value={user.studyHours} icon="clock" />
        <Stat label="Tasks" value={user.tasksCompleted} icon="tasks" />
        <Stat label="Rank" value={`#${user.rank}`} icon="trophy" />
      </View>


      <View style={styles.actionColumn}>
        <QuickBtn label="Edit Profile" icon="user-edit" onPress={() => nav.navigate('editProfile')} />
        <QuickBtn label="Progress Chart" icon="chart-line" onPress={() => nav.navigate('progress')} />
        <QuickBtn label="Focus Settings" icon="eye-slash" onPress={() => nav.navigate('focusMode')} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, icon }) {
  return (
    <View style={styles.statBox}>
      <FontAwesome5 name={icon} size={20} color="#4b7bec" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickBtn({ label, icon, onPress }) {
  return (
    <Pressable style={styles.actionChip} onPress={onPress}>
      <FontAwesome5 name={icon} size={18} color="#fff" style={{ marginRight: 6 }} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: 20 },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700'},
  settingsBtn: { padding: 6 },
  topSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  displayName: { fontSize: 24, fontWeight: '600' },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  levelText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  xpBarBg: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: 10, backgroundColor: '#4b7bec' },
  xpLabel: { marginTop: 6, fontSize: 12, color: '#555' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginVertical: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  badgeRow: { justifyContent: 'space-between' },
  badgeWrapper: { flex: 1, alignItems: 'center', marginBottom: 16 },
  badgeLabel: { marginTop: 4, fontSize: 11, textAlign: 'center' },
  actionColumn: { flexDirection: 'column', marginTop: 32, marginBottom: 40, gap: 12 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4b7bec',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
