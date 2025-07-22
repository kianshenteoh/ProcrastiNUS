import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudyGroupScreen() {
  const [members, setMembers] = useState([
    { id: '1', name: 'Alice', pet: require('@/assets/images/pets/7.png') },
    { id: '2', name: 'Bob', pet: require('@/assets/images/pets/45.png') },
    { id: '3', name: 'Carol', pet: require('@/assets/images/pets/77.png') },
    { id: '4', name: 'Dan', pet: require('@/assets/images/pets/126.png') },
    { id: '5', name: 'Eve', pet: require('@/assets/images/pets/182.png') },
  ]);

  const leaderboard = [
    { id: '1', name: 'Alice', hours: 12.5 },
    { id: '2', name: 'Dan', hours: 10 },
    { id: '3', name: 'Eve', hours: 9 },
    { id: '4', name: 'Carol', hours: 6.5 },
    { id: '5', name: 'Bob', hours: 5.5 },
  ];

  const activityLog = [
    'Alice studied for 2h',
    'Dan fed Carol’s pet',
    'Eve created task “CS Project”',
    'Bob completed “Review Notes”',
    'Carol studied for 1.5h',
  ];

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.title}>📚 Study Group</Text>

      <FlatList
        data={members}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.petScroll}
        renderItem={({ item }) => (
          <View style={styles.petCard}>
            <Image source={item.pet} style={styles.petImg} />
            <Text style={styles.petOwner}>{item.name}</Text>
          </View>
        )}
      />

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>🏆 Weekly Leaderboard</Text>
        {leaderboard.slice(0, 5).map((m, i) => (
          <View key={m.id} style={styles.leaderRow}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Text style={styles.lbName}>{m.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="query-builder" size={16} color="#60a5fa" />
              <Text style={styles.lbHours}>{m.hours}h</Text>
            </View>
          </View>
        ))}
        <Pressable style={styles.moreBtn}>
          <Text style={styles.moreBtnTxt}>View Full Leaderboard</Text>
        </Pressable>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>📝 Activity Log</Text>
        {activityLog.map((log, i) => (
          <Text key={i} style={styles.logEntry}>• {log}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fffbe6', paddingTop: 30 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', alignSelf: 'center', marginBottom: 20 },

  petScroll: { paddingHorizontal: 16, paddingBottom: 16 },
  petCard: { alignItems: 'center', marginHorizontal: 8 },
  petImg: { width: 80, height: 80, resizeMode: 'contain', borderRadius: 40 },
  petOwner: { marginTop: 6, fontWeight: '600', color: '#374151' },

  sectionBox: { marginHorizontal: 20, marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },

  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  rank: { fontWeight: '800', color: '#16a34a', width: 20 },
  lbName: { flex: 1, fontWeight: '600', color: '#374151' },
  lbHours: { marginLeft: 6, fontWeight: '700', color: '#0ea5e9' },
  moreBtn: { marginTop: 8, alignSelf: 'flex-end' },
  moreBtnTxt: { fontWeight: '700', color: '#3b82f6' },

  logEntry: { fontSize: 13, color: '#374151', marginBottom: 6 }
});
