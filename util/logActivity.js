import { db } from '@/firebase';
import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore';

const getUserName = async (userId) => {
  const profileRef = doc(db, 'users', userId, 'profile', 'data');
  const profileSnap = await getDoc(profileRef);
  return profileSnap.exists() ? profileSnap.data().name : 'Unknown';
};

// 1. Personal log only
export const logToPersonalLog = async (userId, action, target = '') => {
  const actorName = await getUserName(userId);
  const now = new Date();
  await addDoc(collection(db, 'users', userId, 'activityLog'), {
    actor: actorName,
    action,
    target,
    timestamp: now,
  });
};

// 2. Personal + specific group log
export const logToPersonalAndGroupLog = async (userId, groupId, action, target = '') => {
  const actorName = await getUserName(userId);
  const now = new Date();
  await Promise.all([
    addDoc(collection(db, 'users', userId, 'activityLog'), {
      actor: actorName,
      action,
      target,
      timestamp: now,
    }),
    addDoc(collection(db, 'studyGroups', groupId, 'activityLog'), {
      actor: actorName,
      action,
      target,
      timestamp: now,
    }),
  ]);
};

// 3. Personal + all group logs
export const logToAllGroupLogs = async (userId, action, target = '') => {
  const actorName = await getUserName(userId);
  const now = new Date();
  const groupsSnap = await getDocs(collection(db, 'users', userId, 'groups'));
  const groupLogs = [];

  groupsSnap.forEach((docSnap) => {
    const groupId = docSnap.id;
    groupLogs.push(
      addDoc(collection(db, 'studyGroups', groupId, 'activityLog'), {
        actor: actorName,
        action,
        target,
        timestamp: now,
      })
    );
  });

  await Promise.all([
    addDoc(collection(db, 'users', userId, 'activityLog'), {
      actor: actorName,
      action,
      target,
      timestamp: now,
    }),
    ...groupLogs,
  ]);
};
