import petImages from '@/assets/pet-images';
import { auth, db } from '@/firebase';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { computePetStats } from '../components/my-pet/my-pet-backend';

export default function ViewPetScreen() {
  const { friendId } = useLocalSearchParams();
  const [pet, setPet] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0 });
  const [inventory, setInventory] = useState([]);
  const [feedModal, setFeedModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const walletRef = useRef(null);
  const inventoryRef = useRef(null);
  const petRef = useRef(null);

  const foods = [
    { id: 'biscuit', label: 'Biscuit', cost: 5, hunger: 20, icon: 'cookie-bite' },
    { id: 'snack', label: 'Snack', cost: 3, hunger: 15, icon: 'bone' },
    { id: 'premium', label: 'Big Mac', cost: 10, hunger: 40, icon: 'hamburger' },
  ];

  const loadData = async () => {
    setLoading(true);
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail || !friendId) return;

    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    walletRef.current = doc(db, 'users', userId, 'wallet', 'data');
    inventoryRef.current = doc(db, 'users', userId, 'inventory', 'data');
    petRef.current = doc(db, 'users', friendId, 'pet', 'data');

    const [petSnap, walletSnap, invSnap] = await Promise.all([
      getDoc(petRef.current),
      getDoc(walletRef.current),
      getDoc(inventoryRef.current),
    ]);

    if (petSnap.exists()) {
      const data = petSnap.data();
      const { updatedPet } = computePetStats(
        data,
        30,   // HUNGER_THRESHOLD
        20,   // XP_GAIN_RATE
        2     // HUNGER_DROP_RATE
      );

      setPet({
        ...updatedPet,
        level: Math.floor(updatedPet.totalXp / 1000),
        xp: updatedPet.totalXp % 1000,
        xpToNext: 1000,
      });
    }

    if (walletSnap.exists()) setWallet(walletSnap.data());
    if (invSnap.exists()) setInventory(invSnap.data().items || []);

    setLoading(false);
  };

  useEffect(() => {
    if (!friendId) return;

    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;

    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    walletRef.current = doc(db, 'users', userId, 'wallet', 'data');
    inventoryRef.current = doc(db, 'users', userId, 'inventory', 'data');
    petRef.current = doc(db, 'users', friendId, 'pet', 'data');

    setLoading(true);

    const unsubscribe = onSnapshot(petRef.current, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const { updatedPet } = computePetStats(
          data,
          30,  // HUNGER_THRESHOLD
          20,  // XP_GAIN_RATE
          2    // HUNGER_DROP_RATE
        );

        setPet({
          ...updatedPet,
          level: Math.floor(updatedPet.totalXp / 1000),
          xp: updatedPet.totalXp % 1000,
          xpToNext: 1000,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [friendId]);

  useEffect(() => {
    if (!walletRef.current || !inventoryRef.current) return;

    async function loadWalletAndInventory() {
      try {
        const [walletSnap, invSnap] = await Promise.all([
          getDoc(walletRef.current),
          getDoc(inventoryRef.current),
        ]);

        if (walletSnap.exists()) setWallet(walletSnap.data());
        if (invSnap.exists()) setInventory(invSnap.data().items || []);
      } catch (err) {
        console.error('Error loading wallet or inventory:', err);
      }
    }

    loadWalletAndInventory();
  }, [walletRef.current, inventoryRef.current]);



    const buyFood = async (food) => {
    if (wallet.coins < food.cost) return;

    const newCoins = wallet.coins - food.cost;
    const updatedInventory = [...inventory, food];

    await updateDoc(walletRef.current, { coins: newCoins });
    await setDoc(inventoryRef.current, { items: updatedInventory });

    setWallet({ coins: newCoins });
    setInventory(updatedInventory);
    };

    const useFood = async (food) => {
    if (!pet) return;

    const updatedPet = { ...pet, hunger: Math.min(100, pet.hunger + food.hunger) };

    // remove one instance of that food
    const index = inventory.findIndex(f => f.id === food.id);
    if (index === -1) return;

    const updatedInventory = [...inventory];
    updatedInventory.splice(index, 1);

    await updateDoc(petRef.current, { hunger: updatedPet.hunger });
    await setDoc(inventoryRef.current, { items: updatedInventory });

    setPet(updatedPet);
    setInventory(updatedInventory);
    };


  if (loading || !pet) {
    return (
      <View style={styles.wrapper}>
        <Text>Loading your friend's pet...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.wallet}><IconText icon="coins" text={wallet.coins} color="#ffd700" /></View>
        <Text style={styles.sectionTitle}>Feed Friend's Pet</Text>
      </View>
      <View style={styles.petCard}>
        <Text style={styles.ownerId}>Owner ID: {friendId}</Text>
        <Image source={petImages[typeof pet?.image === 'number' ? pet.image : 0]} style={styles.petImage}/>
        <Text style={styles.petName}>{typeof pet?.name === 'string' ? pet.name : 'Unnamed Pet'}</Text>
        <Text style={styles.level}>Lvl {typeof pet?.level === 'number' ? pet.level : 1}</Text>
        <Text style={styles.hunger}>Hunger: {typeof pet?.hunger === 'number' ? pet.hunger : 0}%</Text>
      </View>

      <Pressable style={styles.shopBtn} onPress={() => setFeedModal(true)}>
        <FontAwesome5 name="store" size={16} color="#fff" />
        <Text style={styles.shopTxt}>Shop</Text>
      </Pressable>

      <Text style={styles.invTitle}>My Inventory</Text>
      {inventory.length ? (
        <FlatList
        data={inventory}
        horizontal
        keyExtractor={(item, idx) => item.id + idx}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => useFood(item)} style={styles.invCard}>
            <FontAwesome5 name={item.icon || 'hamburger'} size={18} color="#f97316" />
            <Text style={styles.invLabel}>{item.label}</Text>
            </TouchableOpacity>
        )}
        />
      ) : (
        <Text style={styles.invEmpty}>No food yet – visit the shop!</Text>
      )}

      <Modal visible={feedModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Shop for treats</Text>
            {foods.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.foodRow, wallet.coins < f.cost && { opacity: 0.4 }]}
                disabled={wallet.coins < f.cost}
                onPress={() => buyFood(f)}
              >
                <Text style={styles.foodLabel}>{f.label}</Text>
                <IconText icon="coins" color="#ffd700" text={f.cost} small />
              </TouchableOpacity>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setFeedModal(false)}>
              <Text style={styles.closeTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function IconText({ icon, color, text, small }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <FontAwesome5 name={icon} size={small ? 14 : 16} color={color} style={{ marginRight: 4 }} />
      <Text style={{ color, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: { padding: 20, backgroundColor: '#fefce8' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  wallet: { flexDirection: 'row' },
  petCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  petImage: { width: 120, height: 120, resizeMode: 'contain' },
  petName: { fontSize: 20, fontWeight: '700', marginTop: 6, color: '#374151' },
  level: { fontSize: 16, color: '#f87171', marginTop: 4 },
  hunger: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a', marginTop: 0, marginBottom: 0 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  foodLabel: { fontSize: 16, color: '#374151' },
  invCard: { width: 90, alignItems: 'center', marginRight: 8, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 10, marginVertical: 10, marginBottom: 20 },
  invLabel: { fontSize: 12, marginTop: 4, color: '#374151', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0ea5e9', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 30, marginTop: 20, marginHorizontal: 100, justifyContent: 'center' },
  shopTxt: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 6 },
  invTitle: { fontSize: 22, fontWeight: '800', marginTop: 32, marginBottom: 6, color: '#1e3a8a', alignSelf: 'flex-start', paddingLeft: 20 },
  invCard: { width: 90, alignItems: 'center', marginHorizontal: 6, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2, marginVertical: 10 },
  invLabel: { fontSize: 12, marginTop: 4, color: '#374151', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#6b7280', alignSelf: 'center', marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#ffffff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12, color: '#1f2937' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  foodLabel: { fontSize: 16, fontWeight: '700', color: '#374151' },
  closeBtn: { alignSelf: 'center', marginTop: 14 },
  closeTxt: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  ownerId: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
