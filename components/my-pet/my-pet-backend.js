import { auth, db } from '@/firebase';
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

  // Always set userId in a hook
  useEffect(() => {
    if (rawEmail) {
      setUserId(rawEmail.replace(/[.#$/[\]]/g, '_'));
    } else {
      setUserId(null);
    }
  }, [rawEmail]);

  // Update ref whenever pet state changes
  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  // Firestore refs (safe)
  const petDocRef = userId ? doc(db, 'users', userId, 'pet', 'data') : null;
  const walletRef = userId ? doc(db, 'users', userId, 'wallet', 'data') : null;
  const inventoryRef = userId ? doc(db, 'users', userId, 'inventory', 'data') : null;

  useEffect(() => {
    if (!userId || !petDocRef || !walletRef || !inventoryRef) return;

    async function fetchOrCreatePet() {
      try {
        const petSnap = await getDoc(petDocRef);
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
          await setDoc(petDocRef, newPet);
          setPet({ ...newPet, level: 1, xp: 0, xpToNext: 1000 });
        } else {
          const petData = petSnap.data();
          const { updatedPet } = computePetStats(
            petData,
            HUNGER_THRESHOLD,
            XP_GAIN_RATE,
            HUNGER_DROP_RATE
          );
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
  }, [userId, petDocRef, walletRef, inventoryRef]);

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
  };

  // Use food
  const useFood = async (food) => {
    await updatePetState(async () => {
      if (!petDocRef || !inventoryRef || !pet) return;

      // 1. Recompute decay up to now
      const { updatedPet } = computePetStats(
        pet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        true
      );

      // 2. Apply feeding bonus
      const fedHunger = Math.min(updatedPet.hunger + food.hunger, 100);
      const newLastUpdated = Date.now();

      // 3. Remove one food from inventory
      const newInventory = [...inventory];
      const index = newInventory.findIndex(f => f.id === food.id);
      if (index > -1) {
        newInventory.splice(index, 1);
      }

      // 4. Write to Firestore
      await updateDoc(petDocRef, {
        hunger: fedHunger,
        totalXp: updatedPet.totalXp,
        lastUpdated: newLastUpdated,
      });
      await updateDoc(inventoryRef, { items: newInventory });

      // 5. Update local state
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