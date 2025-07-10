import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyBXciVIdPwVzPYEFHO2HSaPUgCsERnDT80",
  authDomain: "procrastinus-e27df.firebaseapp.com",
  projectId: "procrastinus-e27df",
  storageBucket: "procrastinus-e27df.firebasestorage.app",
  messagingSenderId: "131378059080",
  appId: "1:131378059080:web:8457cf411c4af3613fc57d",
  measurementId: "G-7RYNWWRKE6"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth;
const isTesting = process.env.JEST_WORKER_ID !== undefined;

try {
  auth = getAuth(app);
} catch (e) {
  if (!isTesting && e.code === 'auth/no-auth') {
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    throw e;
  }
}

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (e) {
  db = getFirestore(app);
}

export { auth, db };

