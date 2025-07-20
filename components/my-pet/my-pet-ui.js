import petImages from '@/assets/pet-images';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PetAndBadges({ pet, wallet, inventory, buyFood, useFood, HUNGER_THRESHOLD, renamePet, setPet, simulateTimePassed, isFeeding}) {
  const router = useRouter();
  const [feedModal, setFeedModal] = useState(false);
  const [nameModal, setNameModal] = useState(pet.name === 'Danny');
  const [newName, setNewName] = useState('');

  const foods = [
    { id: 'biscuit', label: 'Biscuit', cost: 5, hunger: 20, icon: 'cookie-bite' },
    { id: 'snack', label: 'Snack', cost: 3, hunger: 15, icon: 'bone' },
    { id: 'premium', label: 'Big Mac', cost: 10, hunger: 40, icon: 'hamburger' },
  ]; 

  const badges = [
    { id: 'early', name: 'Early Bird', icon: 'sun', color: '#ffbf00' },
    { id: 'streak', name: '7-Day Streak', icon: 'fire', color: '#ff7a00' },
    { id: 'tasks100', name: '100 Tasks', icon: 'tasks', color: '#3b82f6' },
    { id: 'owl', name: 'Night Owl', icon: 'moon', color: '#8e44ad' },
    { id: 'focus', name: 'Focus Champ', icon: 'bolt', color: '#10b981' },
    { id: 'veteran', name: '30-Day Vet', icon: 'trophy', color: '#eab308' },
  ];

  const canAfford = f => wallet.coins >= f.cost;
  const alertFullness = () => {
    Alert.alert('Your pet is already full!', 'But I will be hungry again soon. Visit me later!', [{ text: 'OK', style: 'cancel' }]);
  }
  const alertFullInventory = () => {
    Alert.alert('Inventory Full', 'You cannot carry more food. Please use some before buying more.', [{ text: 'OK', style: 'cancel' }]);
  }

  const xpPct = pet.xp / pet.xpToNext;
  const hungerPct = pet.hunger / 100;
  const hungerColor =
    pet.hunger >= HUNGER_THRESHOLD * 2
      ? '#10b981' // green
      : pet.hunger >= HUNGER_THRESHOLD
      ? '#facc15' // yellow
      : '#ef4444'; // red

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.wallet}>
          <IconText icon="coins" text={wallet.coins} color="#ffd700" />
        </View>
        <Pressable style={styles.leaderboardBtn} onPress={() => router.push('/pet-settings')}>
          <MaterialIcons name="settings" size={22} color="#fff" />
        </Pressable> 
      </View>

      <View style={styles.petBox}>
        <Image source={petImages[pet.image]} style={styles.img} />
        <Text style={styles.petName}>{pet.name}</Text>
      </View>

      <Text style={styles.level}>Lvl {pet.level}</Text>

      <Bar label="XP" val={xpPct} color="#60a5fa" displayText={`XP (${pet.xp}/${pet.xpToNext})`} />
      <Bar label="Hunger" val={hungerPct} color={hungerColor} displayText={`Hunger (${pet.hunger}%)`} />

      <Pressable style={styles.shopBtn} onPress={() => setFeedModal(true)}>
        <FontAwesome5 name="store" size={16} color="#fff" />
        <Text style={styles.shopTxt}>Shop</Text>
      </Pressable>

      {__DEV__ && (
  <Pressable
    style={{ padding: 10, backgroundColor: 'red', marginTop: 20 }}
    onPress={() => simulateTimePassed(5)}>
    <Text style={{ color: 'white' }}>Simulate 5 hours</Text>
  </Pressable>
)}
      <Text style={styles.invTitle}>My Inventory</Text>
      {inventory.length ? (
        <FlatList
          data={inventory}
          horizontal
          keyExtractor={(item, idx) => item.id + idx}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 5 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => pet.hunger >= 100 ? alertFullness() : useFood(item)}
              disabled={isFeeding || pet.hunger >= 100}
              style={[styles.invCard, (isFeeding || pet.hunger >= 100) && { opacity: 0.5 }]}>
              <FontAwesome5 name={item.icon || 'hamburger'} size={18} color="#f97316" />
              <Text style={styles.invLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.invEmpty}>No food yet – visit the shop!</Text>
      )}

      <Text style={styles.badgesTitle}>Badges</Text>
      <View style={styles.badgeGrid}>
        {badges.map(b => (
          <View key={b.id} style={[styles.badgeCard, { backgroundColor: b.color + '55' }]}>
            <View style={[styles.badgeIconWrap, { backgroundColor: b.color }]}> <FontAwesome5 name={b.icon} size={24} color="#fff" /> </View>
            <Text style={styles.badgeLabel}>{b.name}</Text>
          </View>
        ))}
      </View>

      <Modal visible={feedModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Shop for treats</Text>
            {foods.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.foodRow, !canAfford(f) && { opacity: 0.4 }]}
                disabled={!canAfford(f)}
                onPress={() => inventory.length >= 10 ? alertFullInventory() : buyFood(f)}>
                <Text style={styles.foodLabel}>{f.label}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <IconText icon="coins" color="#ffd700" text={f.cost} small />
                </View>
              </TouchableOpacity>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setFeedModal(false)}>
              <Text style={styles.closeTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={nameModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name Your Pet</Text>
            <Text style={{ marginBottom: 12, textAlign: 'center', color: '#4b5563' }}>
              What would you like to name your new companion?
            </Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="e.g. Mochi"
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <Pressable
              style={[styles.shopBtn, { marginTop: 16, justifyContent: 'center' }]}
              onPress={() => {
                if (!newName.trim()) return;
                renamePet(newName.trim());
                setNameModal(false);
              }}
            >
              <Text style={styles.shopTxt}>Save</Text>
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
      <Text style={{ color, fontWeight: '700' }}>
        {typeof text === 'string' || typeof text === 'number' ? String(text) : ''}
      </Text>
    </View>
  );
}

function Bar({ label, val, color, displayText}) {
  return (
    <View style={{ width: '80%', marginVertical: 6 }}>
      <Text style={styles.barLbl}>{displayText || label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${val * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  shopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0ea5e9', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 30, marginTop: 20, justifyContent: 'center' },
  shopTxt: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 6, textAlign: 'center' },

  invTitle: { fontSize: 22, fontWeight: '800', marginTop: 32, marginBottom: 12, color: '#1e3a8a', alignSelf: 'flex-start', paddingLeft: 20 },
  invCard: { width: 90, alignItems: 'center', marginHorizontal: 6, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  invLabel: { fontSize: 12, marginTop: 4, color: '#374151', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#6b7280', alignSelf: 'center', marginTop: 4 },

  inputBox: {backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,},
  input: {fontSize: 16,color: '#111827'},

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
 