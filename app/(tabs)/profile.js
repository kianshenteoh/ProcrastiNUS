import { auth, db } from '@/firebase';
import { getTotalHours, getWeeklyHours } from '@/util/getStudyHours';
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
    weeklyHours: 0,
    totalHours: 0,
    tasksCompleted: 80,
    rank: 2,
    badges: [],
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [nameError, setNameError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  const badges = [
    { id: 'firstTask', name: 'First Task', icon: 'star', color: '#ffbf00' },
    { id: 'taskMaster', name: 'Task Master', icon: 'tasks', color: '#3b82f6' },
    { id: 'productivityPro', name: 'Productivity Pro', icon: 'bolt', color: '#10b981' },
    { id: 'firstFriend', name: 'First Friend', icon: 'user-friends', color: '#ffbf00' },
    { id: 'socialButterfly', name: 'Social Butterfly', icon: 'users', color: '#3b82f6' },
    { id: 'studyBuddy', name: 'Study Buddy', icon: 'book', color: '#10b981' },
    { id: 'firstSession', name: 'First Session', icon: 'star', color: '#ffbf00' },
    { id: 'studyStreak', name: 'Study Streak', icon: 'fire', color: '#ff5e00' },
    { id: 'longSession', name: 'Focused Learner', icon: 'brain', color: '#3b82f6' }
  ];

  const pickImage = async (type) => {
    try {
      let result;
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Camera access is needed to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Gallery access is needed to select photos');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setPickerVisible(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const rawEmail = auth.currentUser?.email;
        if (!rawEmail) return;

        const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
        const profileRef = doc(db, 'users', userId, 'profile', 'data');
        const statsRef = doc(db, 'users', userId, 'stats', 'data');
        const badgesRef = doc(db, 'users', userId, 'badges', 'data');

        try {
          const [profileSnap, statsSnap, badgesSnap] = await Promise.all([
            getDoc(profileRef),
            getDoc(statsRef),
            getDoc(badgesRef),
          ]);

          const profileData = profileSnap.exists() ? profileSnap.data() : {};
          const statsData = statsSnap.exists() ? statsSnap.data() : {};
          const badgesData = badgesSnap.exists() ? badgesSnap.data() : {};

          const [weeklyHours, totalHours] = await Promise.all([
            getWeeklyHours(userId),
            getTotalHours(userId)
          ]);

          setUser(prev => ({
            ...prev,
            name: profileData.name || 'Anonymous',
            avatar: profileData.avatar || prev.avatar,
            totalHours: totalHours || 0,
            weeklyHours: weeklyHours || 0,
            tasksCompleted: profileData.tasksCompleted || 0,
          }));

          setEarnedBadges(badgesData.earned || []);
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      };

      fetchUserData();
      
      if (route.params?.refresh) {
        nav.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh]));

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
          <Pressable onPress={() => {
            setNewName(user.name);
            setNewAvatar(user.avatar);
            setEditModalVisible(true);
          }}>
            <Text style={styles.editProfileBtn}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.actionColumn}>
          <View style={styles.statsRow}>
            <Stat label="Weekly Study hrs" value={user.weeklyHours} icon="hourglass" />
            <Stat label="Total Study hrs" value={user.totalHours} icon="clock" />
            <Stat label="Tasks Completed" value={user.tasksCompleted} icon="tasks" />
          </View>

          <Text style={styles.badgesTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {earnedBadges.length > 0 ? (
              earnedBadges.map(badgeId => {
                const badge = badges.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                  <View key={badge.id} style={[styles.badgeCard, { backgroundColor: badge.color + '55' }]}>
                    <View style={[styles.badgeIconWrap, { backgroundColor: badge.color }]}>
                      <FontAwesome5 name={badge.icon} size={24} color="#fff" />
                    </View>
                    <Text style={styles.badgeLabel}>{badge.name}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noBadgesText}>No badges earned yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Edit Profile</Text>

            <Pressable onPress={() => setPickerVisible(true)}>
              <Image
                source={{ uri: newAvatar }}
                style={{ width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 20 }}
              />
            </Pressable>

            <TextInput
              placeholder="Enter new name"
              value={newName}
              onChangeText={setNewName}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 }}
            />
            {nameError ? (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{nameError}</Text>
            ) : null}

            <Pressable
              style={{ backgroundColor: '#4b7bec', padding: 10, borderRadius: 6, marginBottom: 8 }}
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

                  if (trimmedName.length > 15) {
                    alert('Name is too long! Max: 15 characters.');
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

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable 
          style={styles.pickerBackdrop}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Change Profile Picture</Text>

            <Pressable
              onPress={() => pickImage('camera')}
              style={({ pressed }) => [
                styles.pickerButton,
                pressed && styles.pickerButtonPressed
              ]}
            >
              <FontAwesome5 name="camera" size={18} color="#0ea5e9" style={styles.pickerIcon} />
              <Text style={styles.pickerButtonText}>Take Photo</Text>
            </Pressable>

            <Pressable
              onPress={() => pickImage('gallery')}
              style={({ pressed }) => [
                styles.pickerButton,
                pressed && styles.pickerButtonPressed
              ]}
            >
              <FontAwesome5 name="images" size={18} color="#0ea5e9" style={styles.pickerIcon} />
              <Text style={styles.pickerButtonText}>Choose from Gallery</Text>
            </Pressable>

            <Pressable 
              onPress={() => setPickerVisible(false)} 
              style={styles.pickerCancelButton}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: 20 },
  content: { padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  settingsBtn: { padding: 6 },
  topSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  editProfileBtn: { color: '#2563eb', fontSize: 16, fontWeight: '600', marginTop: 8 },
  displayName: { fontSize: 24, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 4},
  statLabel: { fontSize: 12, color: '#666' },
  actionColumn: { flexDirection: 'column', marginTop: 10, marginBottom: 10, gap: 12 },
  badgesTitle: { fontSize: 22, fontWeight: '800', marginTop: 22, marginBottom: 12, color: 'black', alignSelf: 'flex-start', paddingLeft: 5 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  badgeCard: { width: '45%', alignItems: 'center', marginBottom: 14, paddingVertical: 12, borderRadius: 16 },
  badgeIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeLabel: { color: '#1f2937', fontWeight: '600', textAlign: 'center', fontSize: 10 },
  noBadgesText: { color: '#666', fontStyle: 'italic', textAlign: 'center', width: '100%', marginTop: 20 },
  pickerBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' },
  pickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  pickerButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, marginBottom: 10 },
  pickerButtonPressed: { backgroundColor: '#f0f0f0' },
  pickerIcon: { marginRight: 12 },
  pickerButtonText: { fontSize: 16, color: '#0ea5e9', fontWeight: '600' },
  pickerCancelButton: { marginTop: 10, padding: 10, alignItems: 'center' },
  pickerCancelText: { color: '#888', fontWeight: '600' }
});