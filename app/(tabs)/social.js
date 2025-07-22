import petImages from '@/assets/pet-images';
import { auth, db } from '@/firebase';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { computePetStats } from '../../components/my-pet/my-pet-backend';

export default function SocialScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ coins: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

 useEffect(() => {
  const rawEmail = auth.currentUser?.email;
  if (!rawEmail) return;

  const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
  const walletRef = doc(db, 'users', userId, 'wallet', 'data');

  // 🔁 Realtime wallet updates
  const unsubscribe = onSnapshot(walletRef, (walletSnap) => {
    const data = walletSnap.data();
    if (data?.coins !== undefined) {
      setWallet(data);
    }
  });

  // 🔁 One-time friend load
  const loadFriends = async () => {
    try {
      const friendsData = await fetchFriendsPets();
      setFriendsPets(friendsData);
      await updateFriendRanks();
    } catch (err) {
      console.error('Error loading friends data:', err);
    }
  };

  loadFriends();

  return () => unsubscribe(); // cleanup listener on unmount
}, []);

useFocusEffect(
  useCallback(() => {
    const refreshFriendsPets = async () => {
      const data = await fetchFriendsPets();
      setFriendsPets(data);
    };
    refreshFriendsPets();
  }, [])
);


  const [friendsPets, setFriendsPets] = useState([]);

  const fetchFriendsPets = async (shouldBypassCache = false) => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return [];

    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const cacheRef = doc(db, 'users', userId, 'friends', 'petsCache');

    try {
      // Check if cached data exists
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        const cachedData = cacheSnap.data();
        const lastUpdated = cachedData.lastUpdated?.toMillis?.() || 0;
        const now = Date.now();

        if (!shouldBypassCache && now - lastUpdated < 15 * 60 * 1000 && Array.isArray(cachedData.pets)) {
          console.log("Using cached pets data");
          return cachedData.pets;
        }
      }

      // Otherwise, fetch fresh data and cache it
      const friendsSnap = await getDoc(doc(db, 'users', userId, 'friends', 'list'));
      if (!friendsSnap.exists()) return [];

      const friendIds = Object.keys(friendsSnap.data());
      if (friendIds.length === 0) return [];

      const petPromises = friendIds.map(async (fid) => {
        try {
          const [petSnap, profileSnap] = await Promise.all([
            getDoc(doc(db, 'users', fid, 'pet', 'data')),
            getDoc(doc(db, 'users', fid, 'profile', 'data')),
          ]);

          if (!petSnap.exists()) return null;

          const petData = petSnap.data();
          const { updatedPet } = computePetStats(petData, 30, 20, 2);
          const ownerName = profileSnap.exists() ? profileSnap.data().name : 'Unknown';

          return {
            id: fid,
            ...updatedPet,
            ownerName,
            ownerId: fid,
          };
        } catch {
          return null;
        }
      });

      const petData = await Promise.all(petPromises);
      const result = petData.filter(Boolean);

      // Update the cache with a new timestamp
      await setDoc(cacheRef, {
        pets: result,
        lastUpdated: new Date()
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      return [];
    }
  };



  const [groups, setGroups] = useState([
    {
      id: 'g1',
      name: 'CS Sufferers',
      members: [
        { name: 'Dan', hoursWeek: 14 },
        { name: 'Ton', hoursWeek: 12 },
        { name: 'TKS', hoursWeek: 10 },
      ],
    },
  ]);

  const handleAddFriend = async () => {
    if (!friendEmail) return alert("Please enter a friend's email");

    const currentEmail = auth.currentUser?.email;
    if (!currentEmail) return alert('You are not logged in');

    const currentId = currentEmail.replace(/[.#$/[\]]/g, '_');
    const friendId = friendEmail.trim().replace(/[.#$/[\]]/g, '_');

    if (friendId === currentId) {
      alert('You cannot add yourself as a friend');
      return;
    }

    try {
      // 1. Check if friend exists
      const friendPetRef = doc(db, 'users', friendId, 'pet', 'data');
      const friendPetSnap = await getDoc(friendPetRef);
      if (!friendPetSnap.exists()) {
        alert('User not found');
        return;
      }

      // 2. Check if already friends
      const myFriendsRef = doc(db, 'users', currentId, 'friends', 'list');
      const myFriendsSnap = await getDoc(myFriendsRef);
      if (myFriendsSnap.exists() && myFriendsSnap.data()[friendId]) {
        alert('Friend already added');
        return;
      }

      // 3. Add friend relationship both ways
      await Promise.all([
        setDoc(myFriendsRef, { [friendId]: true }, { merge: true }),
        setDoc(doc(db, 'users', friendId, 'friends', 'list'), 
          { [currentId]: true }, 
          { merge: true }
        ),
      ]);

      // 4. Refresh friends list
      const data = await fetchFriendsPets();
      setFriendsPets(data);

      alert('Friend added!');
      setModalVisible(false);
      setFriendEmail('');
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend. Please try again.');
    }
  };

  const updateFriendRanks = async () => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    try {
      // Get all friends
      const friendsRef = doc(db, 'users', userId, 'friends', 'list');
      const friendsSnap = await getDoc(friendsRef);
      if (!friendsSnap.exists()) return;

      const friendIds = Object.keys(friendsSnap.data());
      if (friendIds.length === 0) return;

      // Get study hours for all friends (including current user)
      const statsPromises = [
        getDoc(doc(db, 'users', userId, 'stats', 'data')),
        ...friendIds.map(fid => getDoc(doc(db, 'users', fid, 'stats', 'data')))
      ];

      const statsSnaps = await Promise.all(statsPromises);
      
      // Create array with user data and timestamps
      const usersData = statsSnaps.map((snap, index) => {
        const id = index === 0 ? userId : friendIds[index - 1];
        const data = snap.exists() ? snap.data() : { totalHours: 0 };
        return {
          id,
          hours: data.totalHours || 0,
          lastUpdated: data.lastUpdated?.toMillis?.() || 0
        };
      });

      // Sort by hours (descending) then by lastUpdated (ascending - later updates rank higher)
      usersData.sort((a, b) => {
        if (b.hours !== a.hours) return b.hours - a.hours;
        return a.lastUpdated - b.lastUpdated;
      });

      // Update ranks in cache
      const cacheRef = doc(db, 'users', userId, 'friends', 'ranksCache');
      await setDoc(cacheRef, {
        ranks: usersData,
        lastUpdated: new Date()
      });

      // Update each user's rank in their profile cache
      await Promise.all(usersData.map(async (user, index) => {
        const rank = index + 1;
        const userProfileRef = doc(db, 'users', user.id, 'profile', 'data');
        await setDoc(userProfileRef, { rank: rank }, { merge: true });
      }));

    } catch (error) {
      console.error('Error updating ranks:', error);
    }
  };

  return (
    <MenuProvider>
      <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 40 }}>
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Friend</Text>

              <TextInput
                placeholder="Enter friend's email"
                value={friendEmail}
                onChangeText={setFriendEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.modalButtons}>
                <Pressable onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={handleAddFriend} style={styles.addBtn}>
                  <Text style={styles.addText}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.headerRow}>
            <View style={styles.wallet}>
                <IconText icon="coins" text={wallet.coins} color="#ffd700" />
            </View>
            <View style={styles.rightButtons}>
              <Menu>
                <MenuTrigger
                  customStyles={{
                    TriggerTouchableComponent: Pressable,
                    triggerWrapper: styles.menuBtn
                  }}
                >
                  <MaterialIcons name="add" size={22} color="#fff" />
                </MenuTrigger>
                <MenuOptions customStyles={styles.menuOptionsStyles}>
                  <MenuOption onSelect={() => setModalVisible(true)}>
                    <View style={styles.menuItem}>
                      <MaterialIcons name="person-add" size={18} color="#3b82f6" />
                      <Text style={styles.menuText}>Add Friend</Text>
                    </View>
                  </MenuOption>
                  <MenuOption onSelect={() => alert('Join Study Group')}>
                    <View style={styles.menuItem}>
                      <MaterialIcons name="group" size={18} color="#10b981" />
                      <Text style={styles.menuText}>Join Study Group</Text>
                    </View>
                  </MenuOption>
                  <MenuOption onSelect={() => alert('Create Study Group')}>
                    <View style={styles.menuItem}>
                      <MaterialIcons name="group-add" size={18} color="#eab308" />
                      <Text style={styles.menuText}>Create Study Group</Text>
                    </View>
                  </MenuOption>
                </MenuOptions>
              </Menu>

              <Pressable style={styles.leaderboardBtn} onPress={() => router.push('/leaderboard')}>
                  <MaterialIcons name="leaderboard" size={22} color="#fff" />
              </Pressable>
            </View>
        </View>

        <View style={styles.friendsTitle}>
          <Text style={styles.title}>My Friends</Text>
        </View>

        <FlatList
          data={friendsPets}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <View style={styles.friendCard}>
              <Image source={petImages[item.image]} style={styles.petImage} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.level}>Lvl {Math.floor(item.totalXp / 1000)}</Text>
              <Text style={styles.hunger}>Hunger: {item.hunger}%</Text>
              <Text style={styles.ownerName}>Owner: {item.ownerName}</Text> 
              <Pressable 
                onPress={() => {
                  router.push({ pathname: '/view-pet', params: { friendId: item.ownerId } });
                }}
                style={styles.feedBtn}
              >
                <Text style={styles.feedTxt}>View Pet</Text>
              </Pressable>
            </View>
          )}
        />

        <Text style={styles.studyGroupTitle}>My Study Groups</Text>
        {groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <Text style={styles.groupName}>{group.name}</Text> 
            {group.members.map((m, idx) => (
              <View key={idx} style={styles.memberRow}> 
                <FontAwesome5 name="user" size={14} color="#0ea5e9" style={{ marginRight: 6 }} />
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberHours}>{m.hoursWeek} hours this week</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </MenuProvider>
  );
}

function IconText({ icon, color, text, small }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 }}>
      <FontAwesome5 name={icon} size={small ? 14 : 18} color={color} style={{ marginRight: 4 }} />
      <Text style={{ color, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fefce8', paddingTop: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1e3a8a' },
  rightButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 8, borderRadius: 16, backgroundColor: '#3b82f6' },
  menuItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16},
  menuText: {marginLeft: 12, fontSize: 14, color: '#111827', fontWeight: '500'},
  menuOptionsStyles: {optionsContainer: {borderRadius: 8, paddingVertical: 4, backgroundColor: '#fff', elevation: 5}},
  friendCard: { width: 160, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 12, marginTop: 16, marginBottom: 12, alignItems: 'center', elevation: 2 },
  petImage: { width: 80, height: 80, resizeMode: 'contain' },
  name: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  level: { fontSize: 12, color: '#f87171' },
  hunger: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  feedBtn: { marginTop: 8, backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  feedTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  friendsTitle: { fontSize: 22, fontWeight: '800', marginTop: 24, marginHorizontal: 20, color: '#1e3a8a' },
  studyGroupTitle: { fontSize: 22, fontWeight: '800', marginTop: 24, marginHorizontal: 20, color: '#1e3a8a' },
  groupCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 16, elevation: 2 },
  groupName: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1e3a8a' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 1 },
  memberHours: { fontSize: 12, color: '#6b7280' },
  wallet: { flexDirection: 'row' },
  leaderboardBtn: { padding: 8, borderRadius: 16, backgroundColor: '#eab308' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#e5e7eb', borderRadius: 6 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#10b981', borderRadius: 6 },
  cancelText: { color: '#374151', fontWeight: '600' },
  addText: { color: '#fff', fontWeight: '600' },
  ownerName: { fontSize: 12, color: '#9ca3af', marginVertical: 6 },
});