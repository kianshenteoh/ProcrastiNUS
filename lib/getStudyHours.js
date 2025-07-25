import { db } from '@/firebase';
import { startOfWeek } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';

export const getWeeklyHours = async (userId) => {
  const statsRef = doc(db, 'users', userId, 'stats', 'data');
  const statsSnap = await getDoc(statsRef);
  if (!statsSnap.exists()) return 0;
  const stats = statsSnap.data();
  const lastStudied = stats.lastStudied?.toDate?.() || new Date(0);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const isSameWeek = lastStudied >= weekStart;
  const weeklyHours = isSameWeek ? (Math.floor(stats.weeklyMinutes / 30) * 0.5 || 0) : 0;

  return weeklyHours;
};

export const getTotalHours = async (userId) => {
  const statsRef = doc(db, 'users', userId, 'stats', 'data');
  const snap = await getDoc(statsRef);
  return snap.exists() ? Math.floor(snap.data().totalMinutes / 30) * 0.5 || 0 : 0;
};