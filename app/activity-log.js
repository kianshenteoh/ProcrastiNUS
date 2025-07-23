import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ActivityLogScreen() {
  const router = useRouter();

  const fullActivityLog = [
    { id: '1', user: 'Alice', action: 'studied for 2h', time: '2025-07-21T14:30:00Z' },
    { id: '2', user: 'Dan', action: 'fed Carol’s pet', time: '2025-07-21T13:45:00Z' },
    { id: '3', user: 'Eve', action: 'created task “CS Project”', time: '2025-07-20T18:10:00Z' },
    { id: '4', user: 'Bob', action: 'completed “Review Notes”', time: '2025-07-20T15:00:00Z' },
    { id: '5', user: 'Carol', action: 'studied for 1.5h', time: '2025-07-20T09:00:00Z' },
    { id: '6', user: 'Alice', action: 'created task “Read Paper”', time: '2025-07-19T21:10:00Z' },
    { id: '7', user: 'Dan', action: 'studied for 3h', time: '2025-07-19T19:00:00Z' },
    { id: '8', user: 'Bob', action: 'fed Eve’s pet', time: '2025-07-19T14:20:00Z' },
    { id: '9', user: 'Eve', action: 'studied for 2h', time: '2025-07-18T16:00:00Z' },
    { id: '10', user: 'Carol', action: 'completed task “Revise Algorithms”', time: '2025-07-18T11:00:00Z' },
    { id: '11', user: 'Dan', action: 'joined the study group', time: '2025-07-17T12:00:00Z' },
    { id: '12', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
    { id: '13', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
    { id: '14', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
    { id: '15', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
    { id: '16', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
    { id: '17', user: 'Alice', action: 'fed Bob’s pet', time: '2025-07-17T09:30:00Z' },
  ];

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>Full Activity Log</Text>

        <View style={styles.sectionBox}>
      {fullActivityLog.map((entry) => (
        <View key={entry.id} style={styles.logCard}>
          <MaterialIcons name="chevron-right" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
          <View style={styles.logTextContainer}>
            <Text style={styles.logMainText}>
              <Text style={styles.logUser}>{entry.user}</Text> {entry.action}
            </Text>
            <Text style={styles.logTimestamp}>
              {new Date(entry.time).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          </View>
          
        </View>
      ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    sectionBox: { marginHorizontal: 0, marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
    wrapper: { flex: 1, backgroundColor: '#fffbe6', paddingTop: 30, paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', alignSelf: 'center', marginBottom: 20 },
    logCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    logTextContainer: { flex: 1 },
    logMainText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
    logUser: { fontWeight: '700', color: '#0f172a' },
    logTimestamp: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
