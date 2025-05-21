
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXciVIdPwVzPYEFHO2HSaPUgCsERnDT80",
  authDomain: "procrastinus-e27df.firebaseapp.com",
  projectId: "procrastinus-e27df",
  storageBucket: "procrastinus-e27df.firebasestorage.app",
  messagingSenderId: "131378059080",
  appId: "1:131378059080:web:8457cf411c4af3613fc57d",
  measurementId: "G-7RYNWWRKE6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// connectAuthEmulator(auth, "http://localhost:9099");

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };

