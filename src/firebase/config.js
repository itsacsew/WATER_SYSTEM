// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvy2UTz7Ehfe14X21zFv7n7Y8jCZgV3So",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "watersystem-bb153.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "watersystem-bb153",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "watersystem-bb153.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "404591487502",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:404591487502:web:3881fb24addc36e3f6ea5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);