import { auth, db } from '@/firebase';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';

export default function SocialScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ coins: 0 });
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

  const [friends, setFriends] = useState([
    { id: '1', name: 'Bella', pet: require('@/assets/images/Pet-Cat-Red.png'), level: 9, hunger: 80 },
    { id: '2', name: 'Carlos', pet: require('@/assets/images/Pet-Parrot-CottonCandyBlue.png'), level: 7, hunger: 60 },
  ]);

  const [groups, setGroups] = useState([
    {
      id: 'g1',
      name: 'Focus Ninjas',
      members: [
        { name: 'Aiden', hoursWeek: 14 },
        { name: 'Bella', hoursWeek: 12 },
        { name: 'Carlos', hoursWeek: 10 },
      ],
    },
  ]);

  return (
    <MenuProvider>
      <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 40 }}>

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
                  <MenuOption onSelect={() => alert('Add Friend')}>
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
          data={friends}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <View style={styles.friendCard}>
              <Image source={item.pet} style={styles.petImage} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.level}>Lvl {item.level}</Text>
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
                <Text style={styles.memberHours}>{m.hoursWeek}h this week</Text>
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
});
