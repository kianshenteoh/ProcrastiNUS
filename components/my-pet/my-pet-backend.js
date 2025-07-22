import { auth, db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  const petRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const rawEmail = auth.currentUser?.email;

  const userId = useMemo(() => {
    return rawEmail?.replace(/[.#$/[\]]/g, '_') || null;
  }, [rawEmail]);

  const petDocRef = useMemo(() => userId ? doc(db, 'users', userId, 'pet', 'data') : null, [userId]);
  const walletRef = useMemo(() => userId ? doc(db, 'users', userId, 'wallet', 'data') : null, [userId]);
  const inventoryRef = useMemo(() => userId ? doc(db, 'users', userId, 'inventory', 'data') : null, [userId]);
  const profileRef = useMemo(() => userId ? doc(db, 'users', userId, 'profile', 'data') : null, [userId]);

  useEffect(() => {
    if (!userId || !petDocRef || !walletRef || !inventoryRef || !profileRef) return;

    async function fetchOrCreatePet() {
      try {
        const cached = await AsyncStorage.getItem(`petData_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const { updatedPet } = computePetStats(
            parsed.pet,
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
            ownerId: userId,
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

        await AsyncStorage.setItem(`petData_${userId}`, JSON.stringify({
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
  }, [userId, petDocRef, walletRef, inventoryRef, profileRef]);

  useEffect(() => {
    if (!petDocRef || !userId) return;

    let lastSaveTime = Date.now();
    const interval = setInterval(() => {
      if (isUpdatingRef.current || !petRef.current) return;

      const currentPet = petRef.current;
      const { updatedPet } = computePetStats(
        currentPet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        false
      );

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

  useEffect(() => {
    if (pet) petRef.current = pet;
  }, [pet]);

  if (!rawEmail) return <LoginScreen />;
  if (loading || !pet) return null;

  const updatePetState = async (updateFn) => {
    if (!petDocRef || !pet) return;

    isUpdatingRef.current = true;
    try {
      await updateFn();
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  const buyFood = async (food) => {
    if (!walletRef || !inventoryRef) return;
    if (wallet.coins < food.cost) return;

    const newWallet = { coins: wallet.coins - food.cost };
    const newInventory = [...inventory, food];

    await updateDoc(walletRef, newWallet);
    await updateDoc(inventoryRef, { items: newInventory });
    setWallet(newWallet);
    setInventory(newInventory);

    if (rawEmail) {
      const id = rawEmail.replace(/[.#$/[\]]/g, '_');
      await AsyncStorage.removeItem(`petData_${id}`);
    }
  };

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

      if (updatedPet.hunger >= 100) {
        console.warn("Pet is already full.");
        return;
      }

      const fedHunger = Math.min(updatedPet.hunger + food.hunger, 100);
      const newLastUpdated = Date.now();

      const newInventory = [...inventory];
      const index = newInventory.findIndex(f => f.id === food.id);
      if (index > -1) {
        newInventory.splice(index, 1);
      }

      await updateDoc(petDocRef, {
        hunger: fedHunger,
        totalXp: updatedPet.totalXp,
        lastUpdated: newLastUpdated,
      });

      await updateDoc(inventoryRef, { items: newInventory });

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

  const simulateTimePassed = async (hours) => {
    await updatePetState(async () => {
      if (!petDocRef || !pet) return;

      const { updatedPet: currentPet } = computePetStats(
        pet,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        false
      );

      const simulatedLastUpdated = Date.now() - (hours * 3600000);

      const petAtSimulatedTime = {
        ...currentPet,
        lastUpdated: simulatedLastUpdated
      };

      const { updatedPet: finalPet } = computePetStats(
        petAtSimulatedTime,
        HUNGER_THRESHOLD,
        XP_GAIN_RATE,
        HUNGER_DROP_RATE,
        true
      );

      await updateDoc(petDocRef, {
        hunger: finalPet.hunger,
        totalXp: finalPet.totalXp,
        lastUpdated: finalPet.lastUpdated
      });

      setPet({
        ...finalPet,
        level: Math.floor(finalPet.totalXp / 1000),
        xp: finalPet.totalXp % 1000,
        xpToNext: 1000,
      });
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