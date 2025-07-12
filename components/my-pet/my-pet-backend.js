import { auth, db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import LoginScreen from '../../app/LoginScreen';
import PetAndBadges from './my-pet-ui';

export default function PetAndBadgesBackend() {
  const HUNGER_THRESHOLD = 30;
  const HUNGER_DROP_RATE = 2;
  const XP_GAIN_RATE = 20;

  const [pet, setPet] = useState(null);
  const [wallet, setWallet] = useState({ coins: 100000 });
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [userId, setUserId] = useState(null);

  const rawEmail = auth.currentUser?.email;

  // Always set userId in a hook
  useEffect(() => {
    if (rawEmail) {
      setUserId(rawEmail.replace(/[.#$/[\]]/g, '_'));
    } else {
      setUserId(null);
    }
  }, [rawEmail]);

  // Firestore refs (safe)
  const petRef = userId ? doc(db, 'users', userId, 'pet', 'data') : null;
  const walletRef = userId ? doc(db, 'users', userId, 'wallet', 'data') : null;
  const inventoryRef = userId ? doc(db, 'users', userId, 'inventory', 'data') : null;

  useEffect(() => {
    if (!userId || !petRef || !walletRef || !inventoryRef) return;

    async function fetchOrCreatePet() {
      try {
        const petSnap = await getDoc(petRef);
        const walletSnap = await getDoc(walletRef);
        const inventorySnap = await getDoc(inventoryRef);

        // PET
        if (!petSnap.exists()) {
          const newPet = {
            ownerId: userId,
            name: 'Danny',
            hunger: 100,
            totalXp: 1000,
            lastUpdated: Date.now(),
            image: Math.floor(Math.random() * 200),
          };
          await setDoc(petRef, newPet);
          setPet({ ...newPet, level: 1, xp: 0, xpToNext: 1000 });
        } else {
          const petData = petSnap.data();
          const { updatedPet } = computePetStats(
            petData,
            HUNGER_THRESHOLD,
            XP_GAIN_RATE,
            HUNGER_DROP_RATE
          );
          await updateDoc(petRef, { ...updatedPet });
          setPet({
            ...updatedPet,
            level: Math.floor(updatedPet.totalXp / 1000),
            xp: updatedPet.totalXp % 1000,
            xpToNext: 1000,
          });
        }

        // WALLET
        if (!walletSnap.exists()) {
          await setDoc(walletRef, { coins: 10000 });
          setWallet({ coins: 10000 });
        } else {
          const walletData = walletSnap.data();
          if (walletData?.coins === undefined || walletData.coins === null) {
            await updateDoc(walletRef, { coins: 0 });
            setWallet({ coins: 0 });
          } else {
            setWallet(walletData);
          }
        }

        // INVENTORY
        if (!inventorySnap.exists()) {
          await setDoc(inventoryRef, { items: [] });
          setInventory([]);
        } else {
          setInventory(inventorySnap.data().items || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching pet data:', err);
      }
    }

    fetchOrCreatePet();
  }, [userId, petRef, walletRef, inventoryRef]);

  // XP/Hunger timer
  useEffect(() => {
    if (!pet || !userId || !petRef) return;

    const interval = setInterval(() => {
      const { updatedPet } = computePetStats(
        pet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE
      );
      setPet(prev => ({
        ...prev,
        ...updatedPet,
        level: Math.floor(updatedPet.totalXp / 1000),
        xp: updatedPet.totalXp % 1000,
      }));
      updateDoc(petRef, updatedPet);
    }, 1000);

    return () => clearInterval(interval);
  }, [pet, userId, petRef]);

  // Guards before rendering
  if (!rawEmail) {
    return <LoginScreen />;
  }

  if (loading || !pet) {
    return null;
  }

  // Buy food
  const buyFood = async (food) => {
    if (!walletRef || !inventoryRef) return;
    if (wallet.coins < food.cost) return;

    const newWallet = { coins: wallet.coins - food.cost };
    const newInventory = [...inventory, food];

    await updateDoc(walletRef, newWallet);
    await updateDoc(inventoryRef, { items: newInventory });
    setWallet(newWallet);
    setInventory(newInventory);
  };

  // Use food
  const useFood = async (food) => {
    if (!petRef || !inventoryRef) return;
    const updatedPet = {
      ...pet,
      hunger: Math.min(pet.hunger + food.hunger, 100),
    };
    const newInventory = [...inventory];
    const index = newInventory.findIndex(f => f.id === food.id);
    if (index > -1) {
      newInventory.splice(index, 1);
    }

    await updateDoc(petRef, { hunger: updatedPet.hunger });
    await updateDoc(inventoryRef, { items: newInventory });
    setPet(updatedPet);
    setInventory(newInventory);
  };

  const renamePet = async (newName) => {
    if (!petRef) return;
    const updatedPet = { ...pet, name: newName.trim() };
    await updateDoc(petRef, { name: newName.trim() });
    setPet(updatedPet);
  };

  return (
    <PetAndBadges
      pet={pet}
      wallet={wallet}
      inventory={inventory}
      setPet={setPet}
      setWallet={setWallet}
      buyFood={buyFood}
      useFood={useFood}
      renamePet={renamePet}
      HUNGER_THRESHOLD={HUNGER_THRESHOLD}
    />
  );
}

function computePetStats(petData, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE) {
  const now = Date.now();
  const lastUpdated = typeof petData.lastUpdated === 'number' ? petData.lastUpdated : now;
  const elapsedMs = now - lastUpdated;
  const hours = Math.floor(elapsedMs / (60 * 60 * 1000000000));

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