import petImages from '@/assets/pet-images';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function StudyGroupScreen() {
  const router = useRouter();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [members, setMembers] = useState([
    { id: '1', name: 'Alice', image: 7, totalXp: 1200, hunger: 84, ownerId: '1' },
    { id: '2', name: 'Bob', image: 45, totalXp: 800, hunger: 72, ownerId: '2' },
    { id: '3', name: 'Carol', image: 77, totalXp: 400, hunger: 65, ownerId: '3' },
    { id: '4', name: 'Dan', image: 126, totalXp: 1500, hunger: 90, ownerId: '4' },
    { id: '5', name: 'Eve', image: 182, totalXp: 600, hunger: 78, ownerId: '5' },
  ]);

  const leaderboard = [
    { id: '1', name: 'Alice', hours: 12.5 },
    { id: '2', name: 'Dan', hours: 10 },
    { id: '3', name: 'Eve', hours: 9 },
    { id: '4', name: 'Carol', hours: 6.5 },
    { id: '5', name: 'Bob', hours: 5.5 },
  ];

  const activityLog = [
    { id: '1', user: 'Alice', action: 'studied for 2h', time: '2025-07-21T14:30:00Z' },
    { id: '2', user: 'Dan', action: 'fed Carol’s pet', time: '2025-07-21T13:45:00Z' },
    { id: '3', user: 'Eve', action: 'created task “CS Project”', time: '2025-07-20T18:10:00Z' },
    { id: '4', user: 'Bob', action: 'completed “Review Notes”', time: '2025-07-20T15:00:00Z' },
    { id: '5', user: 'Carol', action: 'studied for 1.5h', time: '2025-07-20T09:00:00Z' },
  ];

  const badgeColors = {
    fire: '#f97316',
    tasks: '#3b82f6',
    sun: '#facc15',
    trophy: '#eab308',
    bolt: '#10b981',
    moon: '#8b5cf6',
  };
  
  const handleInviteMember = () => {setInviteModalVisible(false);}

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 80 }}>
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <TextInput
              placeholder="Invite member email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
              <Pressable onPress={() => setInviteModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleInviteMember} style={styles.addBtn}>
                <Text style={styles.addText}>Invite</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerRow}>
        <Text style={styles.title}>Study Group Name</Text>
        <Pressable style={styles.inviteBtn} onPress={() => setInviteModalVisible(true)}>
          <MaterialIcons name="person-add-alt" size={18} color="#fff" />
          <Text style={styles.inviteTxt}>Invite</Text>
        </Pressable>
      </View>

      <FlatList
        data={members}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.petScroll}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <Image source={petImages[item.image]} style={styles.petImage} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.level}>Lvl {Math.floor(item.totalXp / 1000)}</Text>
            <Text style={styles.hunger}>Hunger: {item.hunger}%</Text>
            <Text style={styles.ownerName}>Owner: {item.name}</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/view-pet', params: { friendId: item.ownerId } })
              }
              style={styles.feedBtn}
            >
              <Text style={styles.feedTxt}>View Pet</Text>
            </Pressable>
          </View>
        )}
      />

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}> 🏆 Weekly Top 5 Grinders</Text>
          {leaderboard.slice(0, 5).map((item, index) => (
            <View key={item.id} style={[styles.lbCard, index < 3 && { borderColor: '#facc15', borderWidth: 2 }]}>
              <View style={styles.lbRank}><Text style={styles.lbRankTxt}>{index + 1}</Text></View>
              <Image source={petImages[members.find(m => m.id === item.id)?.image]} style={styles.lbAvatar} />
              <View style={styles.lbInfoCol}>
                <Text style={styles.lbPetName}>{members.find(m => m.id === item.id)?.name || 'Unknown'}</Text>
                <Text style={styles.lbOwnerName}>Owner: {members.find(m => m.id === item.id)?.name || 'Unknown'}</Text>
                <Text style={styles.lbLevel}>Lvl {Math.floor(members.find(m => m.id === item.id)?.totalXp / 1000)}</Text>

              </View>
              <View style={styles.lbHoursCol}>
                <View style={styles.lbHourRow}>
                  <MaterialIcons name="query-builder" size={16} color="#60a5fa" />
                  <Text style={styles.lbHourVal}>{item.hours}h</Text>
                </View>
                <Text style={styles.lbWeekLbl}>this week</Text>
                <Text style={styles.lbTotalLbl}>~ total</Text>
              </View>
            </View>
          ))}
          <Pressable onPress={() => router.push('/leaderboard')} style={styles.viewFullLbBtn}>
            <Text style={styles.viewFullLbTxt}>View Full Group Leaderboard</Text>
          </Pressable>
        </View>


        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {activityLog.slice(0, 10).map((log, i) => (
            <View key={i} style={styles.logRow}>
              <MaterialIcons name="chevron-right" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
              <View style={styles.logTextContainer}>
                <Text style={styles.logText}><Text style={styles.logUser}>{log.user}</Text> {log.action}</Text>
                <Text style={styles.logTimestamp}>
                  {new Date(log.time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              </View>
            </View>
          ))}
          <Pressable onPress={() => router.push('/activity-log')} style={styles.viewFullLogBtn}>
            <Text style={styles.viewFullLogTxt}>View Full Activity Log</Text>
          </Pressable>
        </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fffbe6', paddingTop: 30 },
  title: { fontSize: 21, fontWeight: '800', color: '#1e3a8a', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  inviteTxt: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 },
  petScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  friendCard: { width: 160, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 12, alignItems: 'center', elevation: 2 },
  petImage: { width: 80, height: 80, resizeMode: 'contain' },
  name: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  level: { fontSize: 12, color: '#f87171' },
  hunger: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  ownerName: { fontSize: 12, color: '#9ca3af', marginVertical: 6 },
  feedBtn: { marginTop: 8, backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  feedTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#e5e7eb', borderRadius: 6 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#10b981', borderRadius: 6 },
  cancelText: { color: '#374151', fontWeight: '600' },
  addText: { color: '#fff', fontWeight: '600' },

  sectionBox: { marginHorizontal: 20, marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  lbCard: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, padding: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgb(199,199,199)' },
  lbRank: { width: 30 },
  lbRankTxt: { fontSize: 18, fontWeight: '800', color: '#065f46' },
  lbAvatar: { width: 60, height: 60, resizeMode: 'contain', marginHorizontal: 6 },
  lbInfoCol: { flex: 1, marginLeft: 8 },
  lbPetName: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  lbOwnerName: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 4 },
  lbLevel: { fontSize: 14, fontWeight: '600', color: '#f87171' },
  lbBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  lbBadgeIcon: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  lbMoreDots: { fontSize: 12, color: '#6b7280' },
  lbTotalBadges: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  lbHoursCol: { alignItems: 'flex-end' },
  lbHourRow: { flexDirection: 'row', alignItems: 'center' },
  lbHourVal: { marginLeft: 4, fontSize: 20, fontWeight: '700', color: '#0ea5e9' },
  lbWeekLbl: { fontSize: 10, color: '#6b7280', marginTop: -2 },
  lbTotalLbl: { fontSize: 10, color: '#6b7280', marginTop: 10 },

  viewFullLbBtn: { marginTop: 12, alignSelf: 'flex-end' },
  viewFullLbTxt: { fontWeight: '700', color: '#3b82f6' },
  logRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logText: { fontSize: 14, color: '#374151', flex: 1 },
  logTextContainer: { flex: 1, marginVertical: 2 },
  logUser: { fontWeight: '700', color: '#0f172a' },
  logTimestamp: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  viewFullLogBtn: { marginTop: 12, alignSelf: 'flex-end' },
  viewFullLogTxt: { fontWeight: '700', color: '#3b82f6' }
  });
