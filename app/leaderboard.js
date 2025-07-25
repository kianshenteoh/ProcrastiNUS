import petImages from '@/assets/pet-images';
import { computePetStats } from '@/components/my-pet/my-pet-backend';
import { auth, db } from '@/firebase';
import { getTotalHours, getWeeklyHours } from '@/lib/getStudyHours';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LeaderboardScreen() {
  const badgeColors = {
    fire: '#f97316',
    tasks: '#3b82f6',
    sun: '#facc15',
    trophy: '#eab308',
    bolt: '#10b981',
    moon: '#8b5cf6',
  };

  const [friendsPetsAndHours, setFriendsPetsAndHours] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendsData = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    const safeId = user.email.replace(/[.#$/\[\]]/g, '_');
    const cacheRef = doc(db, 'users', safeId, 'leaderboard', 'cache');

    try {
      const cacheSnap = await getDoc(cacheRef);
      const now = Date.now();
      const lastUpdated = cacheSnap.exists() ? cacheSnap.data().lastUpdated?.toMillis?.() || 0 : 0;

      if (now - lastUpdated < 15 * 60 * 1000 && cacheSnap.exists()) {
        console.log('Using cached leaderboard data');
        return cacheSnap.data().friends || [];
      }

      const friendsListRef = doc(db, 'users', safeId, 'friends', 'list');
      const friendsListSnap = await getDoc(friendsListRef);
      if (!friendsListSnap.exists()) return [];

      const friendIds = [...Object.keys(friendsListSnap.data()), safeId];

      const friendsData = await Promise.all(
        friendIds.map(async (friendId) => {
          try {
            const [petSnap, profileSnap, statsSnap] = await Promise.all([
              getDoc(doc(db, 'users', friendId, 'pet', 'data')),
              getDoc(doc(db, 'users', friendId, 'profile', 'data')),
              getDoc(doc(db, 'users', friendId, 'stats', 'data')),
            ]);

            if (!petSnap.exists()) return null;

            const petData = petSnap.data();
            const { updatedPet } = computePetStats(petData, 30, 20, 2);

            const [hoursWeek, hoursTotal] = await Promise.all([
              getWeeklyHours(friendId),
              getTotalHours(friendId)
            ]);

            return {
              id: friendId,
              petName: updatedPet.name || 'Unknown',
              ownerName: profileSnap.exists() ? profileSnap.data().name : 'Nameless',
              level: Math.floor(updatedPet.totalXp / 1000),
              hoursWeek,
              hoursTotal,
              badgeIcons: ['fire', 'tasks', 'sun'],
              totalBadges: 3,
              pet: petImages[updatedPet.image] || petImages.default,
            };
          } catch {
            return null;
          }
        })
      );

      const result = friendsData.filter(Boolean).sort((a, b) => b.hoursWeek - a.hoursWeek);

      await setDoc(cacheRef, {
        friends: result,
        lastUpdated: new Date(),
      });

      return result;
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      return [];
    }
  };


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchFriendsData();
      setFriendsPetsAndHours(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text>Loading leaderboard...</Text>
      </View>
    );
  }

  if (friendsPetsAndHours.length === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>🏆 Weekly Ranking</Text>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No friends found or data unavailable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.title}>🏆 Weekly Ranking</Text>
      <FlatList
        data={friendsPetsAndHours}
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
              <View style={styles.badgeRow}>
                {item.badgeIcons.map((icon) => (
                  <View key={icon} style={[styles.badgeIcon, { backgroundColor: badgeColors[icon] || '#0ea5e9' }]}>
                    <FontAwesome5 name={icon} size={14} color="#fff" />
                  </View>
                ))}
                <Text style={styles.moreDots}>...</Text>
              </View>
              <Text style={styles.totalBadges}>{item.totalBadges} badges total</Text>
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4
  },
  totalBadges: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  moreDots: { fontSize: 12, color: '#6b7280' },
  hoursCol: { alignItems: 'flex-end' },
  hourRow: { flexDirection: 'row', alignItems: 'center' },
  hourVal: { marginLeft: 4, fontSize: 20, fontWeight: '700', color: '#0ea5e9' },
  weekLbl: { fontSize: 10, color: '#6b7280', marginTop: -2 },
  totalLbl: { fontSize: 10, color: '#6b7280', marginTop: 10 }
});