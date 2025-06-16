import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PetScreen() {
  const [wallet, setWallet] = useState({ taskCoins: 120, studyPoints: 18 });
  const [pet, setPet] = useState({
    name: 'Chompy',
    level: 4,
    xp: 40,
    xpToNext: 200,
    hunger: 55,
    mood: 82,
  });
  const [feedModal, setFeedModal] = useState(false);

  const foods = [
    { id: 'basic', label: 'Biscuit', cost: { taskCoins: 5 }, xp: 10, hunger: 20 },
    { id: 'snack', label: 'Snack', cost: { studyPoints: 3 }, xp: 15, hunger: 15 },
    { id: 'premium', label: 'Fancy Meal', cost: { taskCoins: 10, studyPoints: 5 }, xp: 30, hunger: 40 },
  ];

  const canAfford = food => {
    const { taskCoins = 0, studyPoints = 0 } = food.cost;
    return wallet.taskCoins >= taskCoins && wallet.studyPoints >= studyPoints;
  };

  const feedPet = food => {
    if (!canAfford(food)) return;
    setWallet(w => ({
      taskCoins: w.taskCoins - (food.cost.taskCoins || 0),
      studyPoints: w.studyPoints - (food.cost.studyPoints || 0),
    }));
    setPet(p => ({
      ...p,
      xp: Math.min(p.xp + food.xp, p.xpToNext),
      hunger: Math.min(p.hunger + food.hunger, 100),
    }));
    setFeedModal(false);
  };

  const xpPct = pet.xp / pet.xpToNext;
  const hungerPct = pet.hunger / 100;

  return (
    <View style={s.wrapper}>
      <View style={s.wallet}><IconText icon="coins" color="#f4b400" text={wallet.taskCoins} /><IconText icon="stopwatch" color="#4b7bec" text={wallet.studyPoints} /></View>
      <View style={s.petBox}><Image source={require('../../assets/images/pet.png')} style={s.img} /><Text style={s.petName}>{pet.name}</Text></View>
      <Text style={s.level}>Lv. {pet.level}</Text>
      <Bar label="XP" val={xpPct} color="#4b7bec" />
      <Bar label="Hunger" val={hungerPct} color="#f4b400" />
      <Pressable style={s.feed} onPress={() => setFeedModal(true)}><Text style={s.feedText}>Feed</Text></Pressable>

      <Modal visible={feedModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.title}>Pick food</Text>
            <FlatList
              data={foods}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  disabled={!canAfford(item)}
                  style={[s.row, !canAfford(item) && { opacity: 0.4 }]}
                  onPress={() => feedPet(item)}
                >
                  <Text style={s.food}>{item.label}</Text>
                  <View style={s.rowIcons}>
                    {item.cost.taskCoins && <IconText icon="coins" color="#f4b400" text={item.cost.taskCoins} small />}
                    {item.cost.studyPoints && <IconText icon="stopwatch" color="#4b7bec" text={item.cost.studyPoints} small />}
                  </View>
                </TouchableOpacity>
              )}
            />
            <Pressable onPress={() => setFeedModal(false)}><Text style={s.close}>close</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function IconText({ icon, color, text, small }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 }}>
      <FontAwesome5 name={icon} size={small ? 14 : 18} color={color} style={{ marginRight: 4 }} />
      <Text style={{ color }}>{text}</Text>
    </View>
  );
}

function Bar({ label, val, color }) {
  return (
    <View style={{ width: '80%', marginVertical: 6 }}>
      <Text style={s.barLbl}>{label}</Text>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${val * 100}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', backgroundColor: '#fafafa', paddingTop: 50 },
  wallet: { flexDirection: 'row', marginBottom: 12 },
  petBox: { alignItems: 'center', marginVertical: 10 },
  img: { width: 160, height: 160, resizeMode: 'contain' },
  petName: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  level: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
  barLbl: { fontSize: 12, color: '#555', marginBottom: 4 },
  feed: { backgroundColor: '#4b7bec', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  feedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  food: { fontSize: 16, fontWeight: '500' },
  rowIcons: { flexDirection: 'row' },
  close: { marginTop: 14, alignSelf: 'center', color: '#3479DB', fontWeight: '600' },
});
