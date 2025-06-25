import { auth, db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import PetAndBadges from './my-pet-ui';

export default function PetAndBadgesBackend() {
  const [pet, setPet] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0 });
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
          totalXp: 0,
          lastUpdated: Date.now(),
        };
        await setDoc(petRef, newPet);
        setPet({ ...newPet, level: 1, xp: 0, xpToNext: 1000 });
      } else {
        const petData = petSnap.data();
        const { updatedPet } = computePetStats(petData);
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
        setWallet({ coins: 100 });
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
      xp: Math.min(pet.xp + food.xp, pet.xpToNext),
      hunger: Math.min(pet.hunger + food.hunger, 100),
    };
    const newInventory = [...inventory];
    const index = newInventory.findIndex(f => f.id === food.id);
    if (index > -1) {
      newInventory.splice(index, 1);
    }
    await updateDoc(petRef, {
      hunger: updatedPet.hunger,
      totalXp: pet.totalXp - pet.xp + updatedPet.xp,
    });
    await updateDoc(inventoryRef, { items: newInventory });
    setPet(updatedPet);
    setInventory(newInventory);
  };

  if (loading || !pet) return null;

  return <PetAndBadges pet={pet} wallet={wallet} inventory={inventory} setPet={setPet} setWallet={setWallet} buyFood={buyFood} useFood={useFood} />;
}

function computePetStats(petData) {
  const now = Date.now();
  const elapsedMs = now - (petData.lastUpdated || now);
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));

  let hunger = Math.max(petData.hunger - hours * 2, 0);
  let xpGain = hunger > 30 ? 20 * hours : 0;
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
