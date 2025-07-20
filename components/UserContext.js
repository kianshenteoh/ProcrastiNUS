// context/UserContext.js
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const email = auth.currentUser?.email;
      if (!email) return;

      const userId = email.replace(/[.#$/[\]]/g, '_');

      const profileRef = doc(db, 'users', userId, 'profile', 'data');
      const sessionRef = collection(db, 'users', userId, 'StudySessions');
      const taskRef = collection(db, 'users', userId, 'tasks');
      const petRef = doc(db, 'users', userId, 'pet', 'data');

      const [profileSnap, sessionsSnap, taskSnap, petSnap] = await Promise.all([
        getDoc(profileRef),
        getDocs(sessionRef),
        getDocs(taskRef),
        getDoc(petRef),
      ]);

      const sessions = sessionsSnap.docs.map(d => d.data());
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationInMinutes || 0), 0);
      const totalHours = Math.floor(totalMinutes / 30) * 0.5;
      const completedTasks = taskSnap.docs.filter(doc => doc.data().completed).length;

      setUserData({
        userId,
        name: profileSnap.data()?.name || 'Anonymous',
        studyHours: totalHours,
        tasksCompleted: completedTasks,
        pet: petSnap.data() || {},
      });

      setLoading(false);
    };

    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userData, loading }}>
      {children}
    </UserContext.Provider>
  );
}
