import { auth, db } from '@/firebase';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DailyQuestsScreen() {
  const nav = useNavigation();
  const [claimedQuests, setClaimedQuests] = useState({});
  const [dailyStats, setDailyStats] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0 });

  useEffect(() => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const todayStr = new Date().toDateString();

    const fetchInitialData = async () => {
      try {
        const statsRef = doc(db, 'users', userId, 'dailyStats', 'data');
        const walletRef = doc(db, 'users', userId, 'wallet', 'data');
        
        const [statsSnap, walletSnap] = await Promise.all([
          getDoc(statsRef),
          getDoc(walletRef)
        ]);

        let statsData = { created: 0, completed: 0, date: todayStr };
        if (statsSnap.exists() && statsSnap.data().date === todayStr) {
          statsData = statsSnap.data();
        } else {
          await setDoc(statsRef, statsData);
        }

        setDailyStats(statsData);

        const walletData = walletSnap.exists() ? walletSnap.data() : { coins: 0, claimedQuests: {} };
        if (!walletSnap.exists()) {
          await setDoc(walletRef, walletData);
        }

        const claimedToday = {};
        if (walletData.claimedQuests) {
          Object.keys(walletData.claimedQuests).forEach(questId => {
            claimedToday[questId] = walletData.claimedQuests[questId] === todayStr;
          });
        }
        setClaimedQuests(claimedToday);
        setWallet(walletData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    const statsRef = doc(db, 'users', userId, 'dailyStats', 'data');
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setDailyStats(doc.data());
      }
    });

    fetchInitialData();

    return () => unsubscribe();
  }, []);


  if (!dailyStats) {
    return <Text style={{ padding: 20 }}>Loading quests...</Text>;
  }

  const dailyQuests = [
    { id: 'create2', title: 'Create 2 Tasks', progress: { current: dailyStats.created, target: 2 }, reward: 15 },
    { id: 'complete2', title: 'Complete 2 Tasks', progress: { current: dailyStats.completed, target: 2 }, reward: 30 },
  ];

  const getProgressPct = (current, target) => Math.min(current / target, 1);
  const isComplete = quest => getProgressPct(quest.progress.current, quest.progress.target) >= 1;

  const handleClaim = async (id, reward) => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const today = new Date().toDateString();

    try {
      // Update wallet and mark this quest as claimed
      const walletRef = doc(db, 'users', userId, 'wallet', 'data');
      await updateDoc(walletRef, {
        coins: increment(reward),
        [`claimedQuests.${id}`]: today,
        lastClaimDate: today
      });

      // Update local state
      setClaimedQuests(prev => ({ ...prev, [id]: true }));
      setWallet(prev => ({ ...prev, coins: prev.coins + reward }));
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  const incompleteQuests = dailyQuests.filter(q => !isComplete(q));
  const completedQuests = dailyQuests.filter(q => isComplete(q));

  const renderQuestCard = (quest) => {
    const pct = getProgressPct(quest.progress.current, quest.progress.target);
    const isClaimed = claimedQuests[quest.id];
    const complete = pct >= 1;

    return (
      <View key={quest.id} style={[styles.card, isClaimed && styles.cardClaimed]}>
        <View style={{ flex: 1}}>
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
            onPress={() => handleClaim(quest.id, quest.reward)}
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
      <View style={styles.header}>
        <View style={styles.coinDisplay}>
          <FontAwesome5 name="coins" size={18} color="#ffd700" style={{ marginRight: 6 }} />
          <Text style={styles.coinText}>{wallet.coins}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.list}>
        {incompleteQuests.map(renderQuestCard)}
        {completedQuests.map(renderQuestCard)}
        <View style={{ paddingBottom: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fefce8', paddingTop: 0 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    color: '#ffd700',
    fontWeight: '700',
    fontSize: 16,
  },
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
});