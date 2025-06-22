import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PetAndBadges() {
  const router = useRouter();
  const [wallet, setWallet] = useState({ taskCoins: 120, studyPoints: 18 });
  const [hours, setHours] = useState({ week: 12, total: 220 });
  const [pet, setPet] = useState({ name: 'Chompy', level: 4, xp: 40, xpToNext: 200, hunger: 55, mood: 82 });
  const [feedModal, setFeedModal] = useState(false);
  const [inventory, setInventory] = useState([]);

  const foods = [
    { id: 'basic', label: 'Biscuit', cost: { taskCoins: 5 }, xp: 10, hunger: 20 },
    { id: 'snack', label: 'Snack', cost: { studyPoints: 3 }, xp: 15, hunger: 15 },
    { id: 'premium', label: 'Fancy Meal', cost: { taskCoins: 10, studyPoints: 5 }, xp: 30, hunger: 40 },
  ];

  const badges = [
    { id: 'early', name: 'Early Bird', icon: 'sun', color: '#ffbf00' },
    { id: 'streak', name: '7-Day Streak', icon: 'fire', color: '#ff7a00' },
    { id: 'tasks100', name: '100 Tasks', icon: 'tasks', color: '#3b82f6' },
    { id: 'owl', name: 'Night Owl', icon: 'moon', color: '#8e44ad' },
    { id: 'focus', name: 'Focus Champ', icon: 'bolt', color: '#10b981' },
    { id: 'veteran', name: '30-Day Vet', icon: 'trophy', color: '#eab308' },
  ];

  const canAfford = f => wallet.taskCoins >= (f.cost.taskCoins || 0) && wallet.studyPoints >= (f.cost.studyPoints || 0);

  const buyFood = food => {
    if (!canAfford(food)) return;
    setWallet(w => ({ taskCoins: w.taskCoins - (food.cost.taskCoins || 0), studyPoints: w.studyPoints - (food.cost.studyPoints || 0) }));
    setInventory(inv => [...inv, food]);
    setFeedModal(false);
  };

  const useFood = food => {
    setPet(p => ({
      ...p,
      xp: Math.min(p.xp + food.xp, p.xpToNext),
      hunger: Math.min(p.hunger + food.hunger, 100),
    }));
    setInventory(inv => {
      const index = inv.findIndex(f => f.id === food.id);
      if (index > -1) {
        const newInv = [...inv];
        newInv.splice(index, 1);
        return newInv;
      }
      return inv;
    });
  };

  const xpPct = pet.xp / pet.xpToNext;
  const hungerPct = pet.hunger / 100;

  return (
    <ScrollView contentContainerStyle={s.wrapper}>
      <View style={s.headerRow}>
        <View style={s.wallet}>
          <IconText icon="coins" text={wallet.taskCoins} color="#ffd700" />
          <IconText icon="stopwatch" text={wallet.studyPoints} color="#60a5fa" />
        </View>
        <Pressable style={s.leaderboardBtn} onPress={() => router.push('/leaderboard')}>
          <MaterialIcons name="leaderboard" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={s.petBox}>
        <Image source={require('@/assets/images/Pet-Dog-Golden.png')} style={s.img} />
        <Text style={s.petName}>{pet.name}</Text>
      </View>

      <Text style={s.level}>Lvl {pet.level}</Text>

      <Bar label="XP" val={xpPct} color="#60a5fa" />
      <Bar label="Hunger" val={hungerPct} color="#ffd700" />

      <Pressable style={s.shopBtn} onPress={() => setFeedModal(true)}>
        <FontAwesome5 name="store" size={16} color="#fff" />
        <Text style={s.shopTxt}>Shop</Text>
      </Pressable>

      <Text style={s.invTitle}>My Inventory</Text>
      {inventory.length ? (
        <FlatList
          data={inventory}
          horizontal
          keyExtractor={(item, idx) => item.id + idx}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 5 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => useFood(item)} style={s.invCard}>
              <FontAwesome5 name="hamburger" size={18} color="#f97316" />
              <Text style={s.invLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={s.invEmpty}>No food yet – visit the shop!</Text>
      )}

      <Text style={s.badgesTitle}>Badges</Text>
      <View style={s.badgeGrid}>
        {badges.map(b => (
          <View key={b.id} style={[s.badgeCard, { backgroundColor: b.color + '55' }]}>
            <View style={[s.badgeIconWrap, { backgroundColor: b.color }]}> <FontAwesome5 name={b.icon} size={24} color="#fff" /> </View>
            <Text style={s.badgeLabel}>{b.name}</Text>
          </View>
        ))}
      </View>

      <Modal visible={feedModal} animationType="fade" transparent>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Shop for treats</Text>
            {foods.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[s.foodRow, !canAfford(f) && { opacity: 0.4 }]}
                disabled={!canAfford(f)}
                onPress={() => buyFood(f)}>
                <Text style={s.foodLabel}>{f.label}</Text>
                <View style={{ flexDirection: 'row' }}>
                  {f.cost.taskCoins && <IconText icon="coins" color="#ffd700" text={f.cost.taskCoins} small />}
                  {f.cost.studyPoints && <IconText icon="stopwatch" color="#60a5fa" text={f.cost.studyPoints} small />}
                </View>
              </TouchableOpacity>
            ))}
            <Pressable style={s.closeBtn} onPress={() => setFeedModal(false)}>
              <Text style={s.closeTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
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

function Bar({ label, val, color }) {
  return (
    <View style={{ width: '80%', marginVertical: 6 }}>
      <Text style={s.barLbl}>{label}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${val * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: 'center', backgroundColor: '#fffbe6', paddingVertical: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%' },
  wallet: { flexDirection: 'row' },
  leaderboardBtn: { padding: 8, borderRadius: 16, backgroundColor: '#eab308' },

  petBox: { alignItems: 'center', marginVertical: 12 },
  img: { width: 180, height: 180, resizeMode: 'contain' },
  petName: { fontSize: 24, fontWeight: '800', marginTop: 6, color: '#374151' },
  level: { fontSize: 20, fontWeight: '700', marginVertical: 4, color: '#f87171' },
  barLbl: { fontSize: 14, color: '#6b7280', marginBottom: 2, fontWeight: '600' },
  barBg: { height: 10, borderRadius: 5, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },

  shopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0ea5e9', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 30, marginTop: 20 },
  shopTxt: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 6 },

  invTitle: { fontSize: 22, fontWeight: '800', marginTop: 32, marginBottom: 12, color: '#1e3a8a', alignSelf: 'flex-start', paddingLeft: 20 },
  invCard: { width: 90, alignItems: 'center', marginHorizontal: 6, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  invLabel: { fontSize: 12, marginTop: 4, color: '#374151', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#6b7280', alignSelf: 'center', marginTop: 4 },

  studyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  studyLbl: { fontSize: 12, color: '#374151', marginHorizontal: 8 },

  badgesTitle: { fontSize: 22, fontWeight: '800', marginTop: 32, marginBottom: 12, color: '#1e3a8a', alignSelf: 'flex-start', paddingLeft: 20 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  badgeCard: { width: '45%', alignItems: 'center', marginBottom: 14, paddingVertical: 12, borderRadius: 16 },
  badgeIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeLabel: { color: '#1f2937', fontWeight: '600', textAlign: 'center', fontSize: 10 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#ffffff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12, color: '#1f2937' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  foodLabel: { fontSize: 16, fontWeight: '700', color: '#374151' },
  closeBtn: { alignSelf: 'center', marginTop: 14 },
  closeTxt: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
});
