import petImages from '@/assets/pet-images';
import { computePetStats } from '@/components/my-pet/my-pet-backend';
import { db } from '@/firebase';
import { getTotalHours, getWeeklyHours } from '@/lib/getStudyHours';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function GroupLeaderboardScreen() {
  const { groupId, groupName } = useLocalSearchParams();
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupLeaderboard = async () => {
    const groupRef = doc(db, 'studyGroups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) return [];

    const membersSnap = await getDocs(collection(db, 'studyGroups', groupId, 'members'));
    const memberIds = membersSnap.docs.map(doc => doc.id);

    const memberData = await Promise.all(
      memberIds.map(async (uid) => {
        try {
          const [petSnap, profileSnap, statsSnap] = await Promise.all([
            getDoc(doc(db, 'users', uid, 'pet', 'data')),
            getDoc(doc(db, 'users', uid, 'profile', 'data')),
            getDoc(doc(db, 'users', uid, 'stats', 'data')),
          ]);

          if (!petSnap.exists()) return null;

          const petData = petSnap.data();
          const { updatedPet } = computePetStats(petData, 30, 20, 2);

            const [hoursWeek, hoursTotal] = await Promise.all([
                getWeeklyHours(uid),
                getTotalHours(uid)
            ]);

          return {
            id: uid,
            petName: updatedPet.name || 'Unknown',
            ownerName: profileSnap.exists() ? profileSnap.data().name : 'Nameless',
            level: Math.floor(updatedPet.totalXp / 1000),
            hoursWeek,
            hoursTotal,
            pet: petImages[updatedPet.image] || petImages.default,
          };
        } catch {
          return null;
        }
      })
    );

    return memberData.filter(Boolean).sort((a, b) => b.hoursWeek - a.hoursWeek);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchGroupLeaderboard();
      setGroupMembers(data);
      setLoading(false);
    };
    load();
  }, [groupId]);

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text>Loading group leaderboard...</Text>
      </View>
    );
  }

  if (groupMembers.length === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>🏆 {groupName}'s Leaderboard</Text>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No member data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.title}>🏆 {groupName}'s Leaderboard</Text>
      <FlatList
        data={groupMembers}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <View style={[styles.card, index < 3 && { borderColor: '#facc15', borderWidth: 2 }]}>
            <View style={styles.rank}><Text style={styles.rankTxt}>{index + 1}</Text></View>
            <Image source={item.pet} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.petName}>{item.petName}</Text>
              <Text style={styles.ownerName}>Owner: {item.ownerName}</Text>
              <Text style={styles.level}>Lvl {item.level}</Text>
            </View>
            <View style={styles.hoursCol}>
              <View style={styles.hourRow}>
                <MaterialIcons name="query-builder" size={16} color="#60a5fa" />
                <Text style={styles.hourVal}>{item.hoursWeek}h</Text>
              </View>
              <Text style={styles.weekLbl}>this week</Text>
              <Text style={styles.totalLbl}>{item.hoursTotal}h total</Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fffbe6', paddingTop: 30 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', alignSelf: 'center', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgb(199, 199, 199)'
  },
  rank: { width: 30 },
  rankTxt: { fontSize: 18, fontWeight: '800', color: '#065f46' },
  avatar: { width: 60, height: 60, resizeMode: 'contain', marginHorizontal: 6 },
  infoCol: { flex: 1, marginLeft: 8 },
  petName: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  ownerName: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 4 },
  level: { fontSize: 14, fontWeight: '600', color: '#f87171' },
  hoursCol: { alignItems: 'flex-end' },
  hourRow: { flexDirection: 'row', alignItems: 'center' },
  hourVal: { marginLeft: 4, fontSize: 20, fontWeight: '700', color: '#0ea5e9' },
  weekLbl: { fontSize: 10, color: '#6b7280', marginTop: -2 },
  totalLbl: { fontSize: 10, color: '#6b7280', marginTop: 10 }
});
