import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DailyQuestsScreen() {
  const nav = useNavigation();
  const [claimed, setClaimed] = useState({});

  const dailyQuests = [
    { id: 'complete2', title: 'Complete 2 Tasks', progress: { current: 1, target: 2 }, reward: 50 },
    { id: 'create2', title: 'Create 2 Tasks', progress: { current: 2, target: 2 }, reward: 30 },
    { id: 'noOverdue', title: 'No Overdue Tasks', progress: { current: 1, target: 1 }, reward: 40 }
  ];

  const getProgressPct = (current, target) => Math.min(current / target, 1);
  const isComplete = quest => getProgressPct(quest.progress.current, quest.progress.target) >= 1;

  const handleClaim = (id) => {
    if (!claimed[id]) {
      setClaimed(prev => ({ ...prev, [id]: true }));
      // TODO: integrate reward to wallet in backend
    }
  };

  const incompleteQuests = dailyQuests.filter(q => !isComplete(q));
  const completedQuests = dailyQuests.filter(q => isComplete(q));

  const renderQuestCard = (quest) => {
    const pct = getProgressPct(quest.progress.current, quest.progress.target);
    const isClaimed = claimed[quest.id];
    const complete = pct >= 1;

    return (
      <View key={quest.id} style={[styles.card, isClaimed && styles.cardClaimed]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isClaimed && styles.completedText]}>{quest.title}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{`${quest.progress.current} / ${quest.progress.target}`}</Text>
        </View>
        <View style={styles.rewardBox}>
          <View style={styles.coinRow}>
            <FontAwesome6 name="coins" size={16} color="#ffd700" />
            <Text style={styles.rewardText}>{quest.reward}</Text>
          </View>
          <Pressable
            onPress={() => handleClaim(quest.id)}
            disabled={!complete || isClaimed}
            style={[
              styles.claimBtn,
              (!complete || isClaimed) && styles.claimBtnDisabled
            ]}>
            <Text style={styles.claimTxt}>
              {isClaimed ? 'Claimed' : 'Claim'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.list}>
        <Text style={styles.sectionTitle}>Incomplete</Text>
        {incompleteQuests.length ? incompleteQuests.map(renderQuestCard) : (
          <Text style={styles.empty}>No incomplete quests</Text>
        )}
        <Text style={styles.sectionTitle}>Completed</Text>
        {completedQuests.length ? completedQuests.map(renderQuestCard) : (
          <Text style={styles.empty}>No completed quests</Text>
        )}
        <View style={{ paddingBottom: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingTop: 0 },
  list: { paddingHorizontal: 16, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 10 },
  empty: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 8 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  cardClaimed: { opacity: 0.6 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  completedText: { color: '#16a34a' },
  barBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginTop: 6 },
  barFill: { height: 6, backgroundColor: '#60a5fa' },
  progressLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  rewardBox: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12 },
  coinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rewardText: { fontWeight: '700', color: '#ffd700', marginLeft: 6 },
  claimBtn: { backgroundColor: '#22c55e', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  claimBtnDisabled: { backgroundColor: '#d1d5db' },
  claimTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  tasksBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#3479DB', padding: 20, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 }
});
