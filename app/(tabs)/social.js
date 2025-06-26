import petImages from '@/assets/pet-images';
import { auth, db } from '@/firebase';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';

export default function SocialScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ coins: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      const rawEmail = auth.currentUser?.email;
      if (!rawEmail) return;
      const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
      const walletRef = doc(db, 'users', userId, 'wallet', 'data');
      const snap = await getDoc(walletRef);
      if (snap.exists()) {
        setWallet(snap.data());
      }
    };
    fetchWallet();
  }, []);

  const [friendsPets, setFriendsPets] = useState([]);

  const fetchFriendsPets = async () => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return [];

    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const friendsDocRef = doc(db, 'users', userId, 'friends', 'list');
    const friendsSnap = await getDoc(friendsDocRef);

    if (!friendsSnap.exists()) return [];

    const friendIds = Object.keys(friendsSnap.data()); // an array of friend IDs

    const petData = await Promise.all(friendIds.map(async (fid) => {
      const petRef = doc(db, 'users', fid, 'pet', 'data');
      const petSnap = await getDoc(petRef);
      if (!petSnap.exists()) return null;

      return {
        id: fid,
        ...petSnap.data()  // { name, level, hunger, image }
      };
    }));


    return petData.filter(Boolean);
  }


  useEffect(() =>{
    const loadFriends = async () => {
      const data = await fetchFriendsPets();
      setFriendsPets(data);
      // console.log('pets data', data);
    }
    loadFriends();
    // console.log(friendsPets);
  }, []);


  const [groups, setGroups] = useState([
    {
      id: 'g1',
      name: 'Focus Ninjas',
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

    // check if friend user exists by looking for their pet data
    const friendPetRef = doc(db, 'users', friendId, 'pet', 'data');
    const friendPetSnap = await getDoc(friendPetRef);

    if (!friendPetSnap.exists()) {
      alert('User not found');
      return;
    }

    const myFriendsRef = doc(db, 'users', currentId, 'friends', 'list');
    const theirFriendsRef = doc(db, 'users', friendId, 'friends', 'list');

    try {
      await Promise.all([
        setDoc(myFriendsRef, { [friendId]: true }, { merge: true }),
        setDoc(theirFriendsRef, { [currentId]: true }, { merge: true }),
      ]);

      alert('Friend added!');
      setModalVisible(false);
      setFriendEmail('');
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend. Try again later.');
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
              <Pressable style={styles.feedBtn}><Text style={styles.feedTxt}>View Pet</Text></Pressable>
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
                <Text style={styles.memberHours}>{m.hoursWeek}this week</Text>
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
});
