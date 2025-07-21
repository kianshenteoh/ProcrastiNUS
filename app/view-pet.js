import petImages from '@/assets/pet-images';
import { auth, db } from '@/firebase';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
    const userId   = rawEmail.replace(/[.#$/[\]]/g, '_');
    const cacheKey = `viewPetCache-${friendId}`;
    const now      = Date.now();

    // ── Move these up so refs exist even on cache‐hit ──
    walletRef.current    = doc(db, 'users', userId,   'wallet',    'data');
    inventoryRef.current = doc(db, 'users', userId,   'inventory', 'data');
    petRef.current       = doc(db, 'users', friendId, 'pet',       'data');

    try {
      // 1) Try 5-min AsyncStorage cache
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, pet, wallet, inventory } = JSON.parse(cached);
        if (now - timestamp < 5 * 60 * 1000) {
          setPet(pet);
          setWallet(wallet);
          setInventory(inventory);
          setLoading(false);
          return;
        }
      }

      // 2) Cache miss → fetch fresh from Firestore
      const [petSnap, walletSnap, invSnap] = await Promise.all([
        getDoc(petRef.current),
        getDoc(walletRef.current),
        getDoc(inventoryRef.current),
      ]);

      // 3) Build petObj (handles missing docs safely)
      let petObj;
      if (petSnap.exists()) {
        const data = petSnap.data();
        const { updatedPet } = computePetStats(data, 30, 20, 2);
        petObj = {
          ...updatedPet,
          level:    Math.floor(updatedPet.totalXp / 1000),
          xp:       updatedPet.totalXp % 1000,
          xpToNext: 1000,
        };
      } else {
        console.warn(`No pet for friendId=${friendId}`);
        petObj = {
          ownerId:     friendId,
          ownerName:   'Unknown',
          hunger:      0,
          totalXp:     0,
          lastUpdated: now,
          image:       0,
          level:       0,
          xp:          0,
          xpToNext:    1000,
        };
      }
      setPet(petObj);

      // 4) Wallet & inventory
      const walletData    = walletSnap.exists() ? walletSnap.data() : { coins: 0 };
      const inventoryData = invSnap.exists()   ? invSnap.data().items || [] : [];
      setWallet(walletData);
      setInventory(inventoryData);

      // 5) Save back to cache
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: now,
          pet:       petObj,
          wallet:    walletData,
          inventory: inventoryData,
        })
      );
    } catch (err) {
      console.error('Error loading pet data:', err);
    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    const loadEverything = async () => {
      if (!friendId) return;

      setLoading(true);

      try {
        await loadData(); // loads pet, wallet, inventory, etc. — already includes cache
        if (walletRef.current && inventoryRef.current) {
          const [walletSnap, invSnap] = await Promise.all([
            getDoc(walletRef.current),
            getDoc(inventoryRef.current),
          ]);

          if (walletSnap.exists()) setWallet(walletSnap.data());
          if (invSnap.exists()) setInventory(invSnap.data().items || []);
        }
      } catch (err) {
        console.error('Failed to load everything:', err);
      }

      setLoading(false);
    };

    loadEverything();
  }, [friendId]);



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
      try {
        // 0. Ensure refs and data are available
        if (!pet || !petRef.current || !inventoryRef.current) {
          console.warn('useFood: missing pet or refs', {
            pet,
            petRef: petRef.current,
            inventoryRef: inventoryRef.current,
          });
          return;
        }

        // 1. Compute new hunger and updated inventory
        const newHunger = Math.min(100, pet.hunger + food.hunger);
        const updatedPet = { ...pet, hunger: newHunger };
        const idx = inventory.findIndex(i => i.id === food.id);
        if (idx < 0) {
          console.warn('useFood: food item not in inventory', food, inventory);
          return;
        }
        const updatedInventory = [...inventory];
        updatedInventory.splice(idx, 1);

        // 2. Write changes to your pet document and inventory
        await updateDoc(petRef.current, { hunger: newHunger });
        await setDoc(inventoryRef.current, { items: updatedInventory });

        // 3. Patch the friends’ cache in place
        const rawEmail = auth.currentUser?.email;
        if (rawEmail) {
          const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
          const cacheRef = doc(db, 'users', userId, 'friends', 'petsCache');
          const cacheSnap = await getDoc(cacheRef);
          if (cacheSnap.exists()) {
            const { pets } = cacheSnap.data();
            const patched = pets.map(p =>
              p.ownerId === friendId
                ? { ...p, hunger: newHunger }
                : p
            );
            await setDoc(
              cacheRef,
              { pets: patched, lastUpdated: serverTimestamp() },
              { merge: true }
            );
          }
        }

        // 4. Update local state so the UI reflects the change immediately
        setPet(updatedPet);
        setInventory(updatedInventory);
      } catch (err) {
        console.error('useFood error:', err);
      }
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
        <Text style={styles.sectionTitle}>Feed {typeof pet?.ownerName === 'string' ? pet.ownerName : 'Nameless'}'s Pet</Text>
      </View>
      <View style={styles.petCard}>
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
  ownerName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});