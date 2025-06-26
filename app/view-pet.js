// pages/view-pet.js
import petImages from '@/assets/pet-images';
import { auth, db } from '@/firebase';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ViewPetScreen({}) {
  const router = useRouter();
  const { friendId } = useLocalSearchParams();
  const [pet, setPet] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0 });
  const [inventory, setInventory] = useState([]);

  const foods = [
    { id: 'biscuit', label: 'Biscuit', cost: 5, hunger: 20, icon: 'cookie-bite' },
    { id: 'snack', label: 'Snack', cost: 3, hunger: 15, icon: 'bone' },
    { id: 'premium', label: 'Big Mac', cost: 10, hunger: 40, icon: 'hamburger' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const rawEmail = auth.currentUser?.email;
      if (!rawEmail || !friendId) return;
      const userId = rawEmail.replace(/[.#$/\[\]]/g, '_');

      const petRef = doc(db, 'users', friendId, 'pet', 'data');
      const walletRef = doc(db, 'users', userId, 'wallet', 'data');
      const invRef = doc(db, 'users', userId, 'inventory', 'data');

      const [petSnap, walletSnap, invSnap] = await Promise.all([
        getDoc(petRef), getDoc(walletRef), getDoc(invRef)
      ]);

      if (petSnap.exists()) setPet(petSnap.data());
      if (walletSnap.exists()) setWallet(walletSnap.data());
      if (invSnap.exists()) setInventory(invSnap.data().items || []);
    };

    fetchData();  
  }, [friendId]);

  const feedFriendPet = async (food) => {
    if (wallet.coins < food.cost || !pet) return;

    const petRef = doc(db, 'users', friendId, 'pet', 'data');
    const walletRef = doc(db, 'users', auth.currentUser.email.replace(/[.#$/\[\]]/g, '_'), 'wallet', 'data');

    await Promise.all([
      updateDoc(petRef, { hunger: Math.min(100, pet.hunger + food.hunger) }),
      updateDoc(walletRef, { coins: wallet.coins - food.cost })
    ]);

    setPet(prev => ({ ...prev, hunger: Math.min(100, prev.hunger + food.hunger) }));
    setWallet(prev => ({ ...prev, coins: prev.coins - food.cost }));
  };

  console.log('Pet:', pet);
  
  if (!pet) return <View style={styles.wrapper}><Text>Loading...</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.wallet}><IconText icon="coins" text={wallet.coins} color="#ffd700" /></View>
      </View>

      <View style={styles.petCard}>
        <Image source={petImages[pet.image]} style={styles.petImage} />
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.level}>Lvl {pet.level}</Text>
        <Text style={styles.hunger}>Hunger: {pet.hunger}%</Text>
      </View>

      <Text style={styles.sectionTitle}>Feed Friend's Pet</Text>
      {foods.map(food => (
        <TouchableOpacity
          key={food.id}
          style={[styles.foodRow, wallet.coins < food.cost && { opacity: 0.4 }]}
          onPress={() => feedFriendPet(food)}
          disabled={wallet.coins < food.cost}
        >
          <Text style={styles.foodLabel}>{food.label}</Text>
          <IconText icon="coins" color="#ffd700" text={food.cost} />
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>My Inventory</Text>
      {inventory.length ? (
        <FlatList
          data={inventory}
          horizontal
          keyExtractor={(item, idx) => item.id + idx}
          renderItem={({ item }) => (
            <View style={styles.invCard}>
              <FontAwesome5 name={item.icon || 'hamburger'} size={18} color="#f97316" />
              <Text style={styles.invLabel}>{item.label}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.invEmpty}>No food yet – visit the shop!</Text>
      )}
    </ScrollView>
  );
}

function IconText({ icon, color, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <FontAwesome5 name={icon} size={16} color={color} style={{ marginRight: 4 }} />
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a', marginTop: 20, marginBottom: 10 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  foodLabel: { fontSize: 16, color: '#374151' },
  invCard: { width: 90, alignItems: 'center', marginRight: 8, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  invLabel: { fontSize: 12, marginTop: 4, color: '#374151', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 },
});
