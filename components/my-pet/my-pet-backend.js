import { auth, db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
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
  
  // Use ref to track the latest pet state for the interval
  const petRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const rawEmail = auth.currentUser?.email;

  // Firestore refs (safe)
  const petDocRef = userId ? doc(db, 'users', userId, 'pet', 'data') : null;
  const walletRef = userId ? doc(db, 'users', userId, 'wallet', 'data') : null;
  const inventoryRef = userId ? doc(db, 'users', userId, 'inventory', 'data') : null;
  const profileRef = userId ? doc(db, 'users', userId, 'profile', 'data') : null;

  useEffect(() => {
    if (!rawEmail) return;

    const resolvedUserId = rawEmail.replace(/[.#$/[\]]/g, '_');
    setUserId(resolvedUserId);
    petRef.current = pet;

    const petDocRef = doc(db, 'users', resolvedUserId, 'pet', 'data');
    const walletRef = doc(db, 'users', resolvedUserId, 'wallet', 'data');
    const inventoryRef = doc(db, 'users', resolvedUserId, 'inventory', 'data');
    const profileRef = doc(db, 'users', resolvedUserId, 'profile', 'data');

    async function fetchOrCreatePet() {
      try {
        const cached = await AsyncStorage.getItem(`petData_${resolvedUserId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setPet(parsed.pet);
          setWallet(parsed.wallet);
          setInventory(parsed.inventory);
          setLoading(false);
        }

        const [petSnap, walletSnap, inventorySnap, profileSnap] = await Promise.all([
          getDoc(petDocRef),
          getDoc(walletRef),
          getDoc(inventoryRef),
          getDoc(profileRef),
        ]);

        let finalPet;
        if (!petSnap.exists()) {
          const newPet = {
            ownerId: resolvedUserId,
            ownerName: profileSnap.exists() ? profileSnap.data().name : 'Nameless',
            name: 'Danny',
            hunger: 100,
            totalXp: 1000,
            lastUpdated: Date.now(),
            image: Math.floor(Math.random() * 200),
          };
          await setDoc(petDocRef, newPet);
          finalPet = { ...newPet, level: 1, xp: 0, xpToNext: 1000 };
        } else {
          const petData = petSnap.data();
          const { updatedPet } = computePetStats(petData, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE);
          finalPet = {
            ...updatedPet,
            level: Math.floor(updatedPet.totalXp / 1000),
            xp: updatedPet.totalXp % 1000,
            xpToNext: 1000,
          };
        }

        let finalWallet;
        if (!walletSnap.exists()) {
          finalWallet = { coins: 10000 };
          await setDoc(walletRef, finalWallet);
        } else {
          const walletData = walletSnap.data();
          finalWallet = walletData?.coins === undefined ? { coins: 0 } : walletData;
        }

        let finalInventory;
        if (!inventorySnap.exists()) {
          finalInventory = [];
          await setDoc(inventoryRef, { items: [] });
        } else {
          finalInventory = inventorySnap.data().items || [];
        }

        setPet(finalPet);
        setWallet(finalWallet);
        setInventory(finalInventory);
        setLoading(false);

        await AsyncStorage.setItem(`petData_${resolvedUserId}`, JSON.stringify({
          pet: finalPet,
          wallet: finalWallet,
          inventory: finalInventory,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Error fetching pet data:', err);
      }
    }

    fetchOrCreatePet();
  }, [rawEmail, pet]);


  useEffect(() => {
    if (!petDocRef || !userId) return;

    let lastSaveTime = Date.now();
    const interval = setInterval(() => {
      // Skip if we're currently updating from user actions
      if (isUpdatingRef.current || !petRef.current) return;

      const currentPet = petRef.current;
      const { updatedPet } = computePetStats(
        currentPet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        false
      );

      // Only update if there's an actual change
      if (
        updatedPet.hunger !== currentPet.hunger ||
        updatedPet.totalXp !== currentPet.totalXp
      ) {
        setPet(prev => ({
          ...prev,
          ...updatedPet,
          level: Math.floor(updatedPet.totalXp / 1000),
          xp: updatedPet.totalXp % 1000,
        }));
      }

      // Only save to Firestore once per hour
      if (Date.now() - lastSaveTime > 60 * 60 * 1000) {
        const { updatedPet: savePet } = computePetStats(
          currentPet,
          HUNGER_THRESHOLD,
          XP_GAIN_RATE,
          HUNGER_DROP_RATE,
          true
        );
        updateDoc(petDocRef, savePet);
        lastSaveTime = Date.now();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, petDocRef]);

  // Guards before rendering
  if (!rawEmail) {
    return <LoginScreen />;
  }

  if (loading || !pet) {
    return null;
  }

  // Helper function to update pet state safely
  const updatePetState = async (updateFn) => {
    if (!petDocRef || !pet) return;
    
    isUpdatingRef.current = true;
    try {
      await updateFn();
    } finally {
      // Small delay to ensure state has settled
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

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

    const rawEmail = auth.currentUser?.email;
    if (rawEmail) {
      const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
      await AsyncStorage.removeItem(`petData_${userId}`);
    }
  };


  // Use food
  const useFood = async (food) => {
    await updatePetState(async () => {
      if (!petDocRef || !inventoryRef || !pet) return;

      const { updatedPet } = computePetStats(
        pet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        true
      );

      const currentHunger = updatedPet.hunger;
      const fedHunger = Math.min(currentHunger + food.hunger, 100);

      if (currentHunger >= 100) {
        console.log("Pet is already full.");
        return;
      }

      const newLastUpdated = Date.now();

      // Remove one food item
      const newInventory = [...inventory];
      const index = newInventory.findIndex(f => f.id === food.id);
      if (index > -1) newInventory.splice(index, 1);

      // Write to Firestore
      await updateDoc(petDocRef, {
        hunger: fedHunger,
        totalXp: updatedPet.totalXp,
        lastUpdated: newLastUpdated,
      });
      await updateDoc(inventoryRef, { items: newInventory });

      // Update local state
      setPet({
        ...updatedPet,
        hunger: fedHunger,
        lastUpdated: newLastUpdated,
        level: Math.floor(updatedPet.totalXp / 1000),
        xp: updatedPet.totalXp % 1000,
      });
      setInventory(newInventory);
    });
  };



  //Remove for final deployment
  const simulateTimePassed = async (hours) => {
    await updatePetState(async () => {
      if (!petDocRef || !pet) return;

      // 1. First, get current stats (apply any pending decay)
      const { updatedPet: currentPet } = computePetStats(
        pet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        false
      );

      // 2. Calculate the timestamp for 'hours' ago
      const simulatedLastUpdated = Date.now() - (hours * 3600000);

      // 3. Create a pet object as if it was last updated 'hours' ago
      const petAtSimulatedTime = {
        ...currentPet,
        lastUpdated: simulatedLastUpdated
      };

      // 4. Apply the time passage from that simulated time to now
      const { updatedPet: finalPet } = computePetStats(
        petAtSimulatedTime,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        true
      );

      // 5. Update database
      await updateDoc(petDocRef, {
        hunger: finalPet.hunger,
        totalXp: finalPet.totalXp,
        lastUpdated: finalPet.lastUpdated
      });

      // 6. Update local state
      setPet({
        ...finalPet,
        level: Math.floor(finalPet.totalXp / 1000),
        xp: finalPet.totalXp % 1000,
        xpToNext: 1000,
      });

      console.log(`Simulated ${hours} hour(s) passing.`);
    });
  };

  const renamePet = async (newName) => {
    if (!petDocRef) return;
    const updatedPet = { ...pet, name: newName.trim() };
    await updateDoc(petDocRef, { name: newName.trim() });
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
      simulateTimePassed={simulateTimePassed}
    />
  );
}

export function computePetStats(petData, HUNGER_THRESHOLD, XP_GAIN_RATE, HUNGER_DROP_RATE, commitSave = false) {
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
      lastUpdated: commitSave ? now : petData.lastUpdated,
    },
    xpGained: xpGain,
  };
}