// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvy2UTz7Ehfe14X21zFv7n7Y8jCZgV3So",
  authDomain: "watersystem-bb153.firebaseapp.com",
  projectId: "watersystem-bb153",
  storageBucket: "watersystem-bb153.firebasestorage.app",
  messagingSenderId: "404591487502",
  appId: "1:404591487502:web:3881fb24addc36e3f6ea5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);