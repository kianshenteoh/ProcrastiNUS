import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';
import { Platform } from 'react-native';

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

// Always initialize auth with AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Platform-aware Firestore cache
let db;
try {
  db = initializeFirestore(app, {
    localCache: Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache()
  });
} catch (e) {
  db = getFirestore(app);
}

export { auth, db };

