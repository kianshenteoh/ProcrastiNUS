import { auth, db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import PetAndBadges from './my-pet-ui';

export default function PetAndBadgesBackend() {
  const HUNGER_THRESHOLD = 30; // Hunger threshold for XP gain
  const HUNGER_DROP_RATE = 2; // Hunger drops by 2% per hour
  const XP_GAIN_RATE = 20; // XP gained per hour when hunger is above threshold

  const [pet, setPet] = useState(null);
  const [wallet, setWallet] = useState({ coins: 100000 });
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);

  const uid = auth.currentUser?.uid;
  const petRef = doc(db, 'users', uid, 'pet', 'data');
  const walletRef = doc(db, 'users', uid, 'wallet', 'data');
  const inventoryRef = doc(db, 'users', uid, 'inventory', 'data');

  useEffect(() => {
    if (!uid) return;

    async function fetchOrCreatePet() {
      const petSnap = await getDoc(petRef);
      const walletSnap = await getDoc(walletRef);
      const inventorySnap = await getDoc(inventoryRef);

      if (!petSnap.exists()) {
        const newPet = {
          name: 'Danny',
          hunger: 100,
          totalXp: 1000,
          lastUpdated: Date.now()
        };
        await setDoc(petRef, newPet);
        setPet({ ...newPet, level: 1, xp: 0, xpToNext: 1000 });
      } else {
        const petData = petSnap.data();
        const { updatedPet } = computePetStats(petData, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE);
        await updateDoc(petRef, { ...updatedPet });
        setPet({
          ...updatedPet,
          level: Math.floor(updatedPet.totalXp / 1000),
          xp: updatedPet.totalXp % 1000,
          xpToNext: 1000,
        });
      }

      if (!walletSnap.exists()) {
        await setDoc(walletRef, { coins: 10000 });
        setWallet({ coins: 10000 });
      } else {
        setWallet(walletSnap.data());
      }

      if (!inventorySnap.exists()) { 
        await setDoc(inventoryRef, { items: [] });
        setInventory([]);
      } else {
        setInventory(inventorySnap.data().items || []);
      }

      setLoading(false);
    }

    fetchOrCreatePet();
  }, [uid]);

  useEffect(() => {
  if (!pet) return;

  const interval = setInterval(() => {
    const { updatedPet } = computePetStats(pet, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE);
    setPet(prev => ({
      ...prev,
      ...updatedPet,
      level: Math.floor(updatedPet.totalXp / 1000),
      xp: updatedPet.totalXp % 1000,
    }));
    updateDoc(petRef, updatedPet); 
  }, 10000); 

  return () => clearInterval(interval);
}, [pet]);

  const buyFood = async (food) => {
    if (wallet.coins < food.cost) return;
    const newWallet = { coins: wallet.coins - food.cost };
    const newInventory = [...inventory, food];
    await updateDoc(walletRef, newWallet);
    await updateDoc(inventoryRef, { items: newInventory });
    setWallet(newWallet);
    setInventory(newInventory);
};

  const useFood = async (food) => {
    const updatedPet = {
      ...pet,
      hunger: Math.min(pet.hunger + food.hunger, 100),
    };
    const newInventory = [...inventory];
    const index = newInventory.findIndex(f => f.id === food.id);
    if (index > -1) {
      newInventory.splice(index, 1);
    }
    await updateDoc(petRef, {
      hunger: updatedPet.hunger,
    });
    await updateDoc(inventoryRef, { items: newInventory });
    setPet(updatedPet);
    setInventory(newInventory);
  };

  if (loading || !pet) return null;

  return <PetAndBadges pet={pet} wallet={wallet} inventory={inventory} setPet={setPet} setWallet={setWallet} buyFood={buyFood} useFood={useFood} HUNGER_THRESHOLD={HUNGER_THRESHOLD} />;
}

function computePetStats(petData, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE) {
  const now = Date.now();
  const lastUpdated = typeof petData.lastUpdated === 'number' ? petData.lastUpdated : now;
  const elapsedMs = now - lastUpdated;
  const hours = Math.floor(elapsedMs / (60 * 60 * 1000));

  let hunger = Math.max(petData.hunger - hours * HUNGER_DROP_RATE, 0);
  let xpGain = hunger >= HUNGER_THRESHOLD ? XP_GAIN_RATE * hours : 0;
  let totalXp = (petData.totalXp || 0) + xpGain;

  return {
    updatedPet: {
      ...petData,
      hunger,
      totalXp,
      lastUpdated: now,
    },
    xpGained: xpGain,
  };
}
