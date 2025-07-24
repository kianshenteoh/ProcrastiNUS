import { db } from '@/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ActivityLogScreen() {
  const { groupId, groupName } = useLocalSearchParams();
  const [logEntries, setLogEntries] = useState([]);

  useEffect(() => {
    const fetchGroupLogs = async () => {
      try {
        const logQuery = query(
        collection(db, 'studyGroups', groupId, 'activityLog'),
        orderBy('timestamp', 'desc'),
        limit(100)
        );

        const snapshot = await getDocs(logQuery);
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogEntries(entries);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      }
    };

    fetchGroupLogs();
  }, [groupId]);

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>{groupName}'s Full Activity Log</Text>

      <View style={styles.sectionBox}>
        {logEntries.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6b7280' }}>No activity found.</Text>
        ) : (
          logEntries.map((entry) => (
            <View key={entry.id} style={styles.logCard}>
              <MaterialIcons name="chevron-right" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
              <View style={styles.logTextContainer}>
                <Text style={styles.logMainText}>
                  <Text style={styles.logUser}>{entry.actor}</Text> {entry.action} <Text style={styles.logUser}>{entry.target}</Text>
                </Text>
                <Text style={styles.logTimestamp}>
                  {new Date(entry.timestamp?.toDate?.() || entry.timestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fffbe6', paddingTop: 30, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', alignSelf: 'center', marginBottom: 20 },
  sectionBox: { marginHorizontal: 0, marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  emptyText: { textAlign: 'center', color: '#6b7280' },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  icon: { marginRight: 8 },
  logTextContainer: { flex: 1 },
  logMainText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
  logUser: { fontWeight: '700', color: '#0f172a' },
  logTimestamp: { fontSize: 12, color: '#6b7280', marginTop: 2 }
});
