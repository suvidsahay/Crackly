// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "crackedly-f6dba.firebaseapp.com",
  projectId: "crackedly-f6dba",
  storageBucket: "crackedly-f6dba.firebasestorage.app",
  messagingSenderId: "892870002591",
  appId: "1:892870002591:web:6720e9548cc5f81a21dfaa",
  measurementId: "G-W1WS7ZF7G3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider(); 