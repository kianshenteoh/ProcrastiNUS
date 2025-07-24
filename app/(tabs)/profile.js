import { auth, db } from '@/firebase';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { collectionGroup, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const nav = useNavigation();
  const route = useRoute();

  const [user, setUser] = useState({
    name: '',
    avatar: 'https://i.pinimg.com/474x/e6/e4/df/e6e4df26ba752161b9fc6a17321fa286.jpg',
    level: 0,
    xp: 0,
    xpToNext: 1000,
    studyHours: 0,
    tasksCompleted: 80,
    rank: 2,
    badges: [],
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [nameError, setNameError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const badges = [
    { id: 'early', name: 'Early Bird', icon: 'sun', color: '#ffbf00' },
    { id: 'streak', name: '7-Day Streak', icon: 'fire', color: '#ff7a00' },
    { id: 'tasks100', name: '100 Tasks', icon: 'tasks', color: '#3b82f6' },
    { id: 'owl', name: 'Night Owl', icon: 'moon', color: '#8e44ad' },
    { id: 'focus', name: 'Focus Champ', icon: 'bolt', color: '#10b981' },
    { id: 'veteran', name: '30-Day Vet', icon: 'trophy', color: '#eab308' },
  ];

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const rawEmail = auth.currentUser?.email;
        if (!rawEmail) return;

        const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
        const profileRef = doc(db, 'users', userId, 'profile', 'data');
        const statsRef = doc(db, 'users', userId, 'stats', 'data');

        try {
          const [profileSnap, statsSnap] = await Promise.all([
            getDoc(profileRef),
            getDoc(statsRef),
          ]);

          const profileData = profileSnap.exists() ? profileSnap.data() : {};
          const statsData = statsSnap.exists() ? statsSnap.data() : {};

          setUser(prev => ({
            ...prev,
            name: profileData.name || 'Anonymous',
            avatar: profileData.avatar || prev.avatar,
            studyHours: profileData.studyHours || 0,
            tasksCompleted: profileData.tasksCompleted || 0,
          }));
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      };

      fetchUserData();
      
      // Clear refresh param if it exists
      if (route.params?.refresh) {
        nav.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh]) // Only re-run when refresh param changes
  );

  return (
    <View style={{ flex: 1 }}>
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
          <QuickBtn
            label="Edit Profile"
            icon="user-edit"
            onPress={() => {
              setNewName(user.name);
              setNewAvatar(user.avatar);
              setEditModalVisible(true);
            }}
          />
          <Text style={styles.badgesTitle}>Badges</Text>
                <View style={styles.badgeGrid}>
                  {badges.map(b => (
                    <View key={b.id} style={[styles.badgeCard, { backgroundColor: b.color + '55' }]}>
                      <View style={[styles.badgeIconWrap, { backgroundColor: b.color }]}>
                        <FontAwesome5 name={b.icon} size={24} color="#fff" />
                      </View>
                      <Text style={styles.badgeLabel}>{b.name}</Text>
                    </View>
                  ))}
                </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Edit Profile</Text>

            <Pressable onPress={() => setPickerVisible(true)}>
              <Image
                source={{ uri: newAvatar }}
                style={{ width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 10 }}
              />
            </Pressable>

            <TextInput
              placeholder="Enter new name"
              value={newName}
              onChangeText={setNewName}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 6 }}
            />
            {nameError ? (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{nameError}</Text>
            ) : null}

            <Pressable
              style={{ backgroundColor: '#4b7bec', padding: 10, borderRadius: 6, marginBottom: 6 }}
              onPress={async () => {
                const rawEmail = auth.currentUser?.email;
                if (!rawEmail) return;
                const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
                const profileRef = doc(db, 'users', userId, 'profile', 'data');
                const usernameIndexRef = doc(db, 'usernames', 'index');

                const trimmedName = newName.trim();
                const lowerName = trimmedName.toLowerCase();

                try {
                  if (trimmedName === user.name && newAvatar === user.avatar) {
                    setEditModalVisible(false);
                    return;
                  }

                  const nameQuery = query(
                    collectionGroup(db, 'profile'),
                    where('name', '==', trimmedName)
                  );
                  const results = await getDocs(nameQuery);

                  const isTaken = results.docs.some(doc => doc.ref.path !== `users/${userId}/profile/data`);

                  if (isTaken) {
                    setNameError('Username already taken');
                    return;
                  }

                  const updates = {};
                  if (trimmedName !== user.name) updates.name = trimmedName;
                  if (newAvatar !== user.avatar) updates.avatar = newAvatar;

                  if (Object.keys(updates).length > 0) {
                    await setDoc(profileRef, updates, { merge: true });
                    await setDoc(usernameIndexRef, { [userId]: lowerName }, { merge: true });
                  }

                  setUser(prev => ({ ...prev, ...updates }));
                  setNameError('');
                  setEditModalVisible(false);
                } catch (err) {
                  console.error('Failed to update profile:', err);
                  Alert.alert('Error', 'Failed to update profile');
                }
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Save</Text>
            </Pressable>

            <Pressable onPress={() => setEditModalVisible(false)}>
              <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Change Profile Picture</Text>

            <Pressable
              onPress={async () => {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) return;
                const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  setNewAvatar(result.assets[0].uri);
                }
                setPickerVisible(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
            >
              <FontAwesome5 name="camera" size={18} color="#0ea5e9" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#0ea5e9', fontWeight: '600' }}>Camera</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) return;
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  setNewAvatar(result.assets[0].uri);
                }
                setPickerVisible(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
            >
              <FontAwesome5 name="images" size={18} color="#0ea5e9" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#0ea5e9', fontWeight: '600' }}>Choose from Gallery</Text>
            </Pressable>

            <Pressable onPress={() => setPickerVisible(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: '#888', fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  content: { padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  settingsBtn: { padding: 6 },
  topSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  displayName: { fontSize: 24, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginVertical: 4 },
  statLabel: { fontSize: 12, color: '#666' },
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
  badgesTitle: { fontSize: 22, fontWeight: '800', marginTop: 32, marginBottom: 12, color: '#1e3a8a', alignSelf: 'flex-start', paddingLeft: 20 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  badgeCard: { width: '45%', alignItems: 'center', marginBottom: 14, paddingVertical: 12, borderRadius: 16 },
  badgeIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeLabel: { color: '#1f2937', fontWeight: '600', textAlign: 'center', fontSize: 10 },
});