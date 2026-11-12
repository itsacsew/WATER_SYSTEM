// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================
// FIREBASE 1 (MAIN - Watersystem)
// ============================================================
const firebaseConfig1 = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvy2UTz7Ehfe14X21zFv7n7Y8jCZgV3So",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "watersystem-bb153.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "watersystem-bb153",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "watersystem-bb153.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "404591487502",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:404591487502:web:3881fb24addc36e3f6ea5f"
};

// ============================================================
// FIREBASE 2 (Payroll project)
// ============================================================
const firebaseConfig2 = {
  apiKey: "AIzaSyCbpSNuzxP5WCqTRUeoUpC0C-BEawW5IJI",
  authDomain: "payroll-e3cc5.firebaseapp.com",
  projectId: "payroll-e3cc5",
  storageBucket: "payroll-e3cc5.firebasestorage.app",
  messagingSenderId: "711658369480",
  appId: "1:711658369480:web:45e4d26e3af96a932250fd",
  measurementId: "G-QX5EX89P7S"
};

// ============================================================
// FIREBASE 3 (Water-4af97)
// ============================================================
const firebaseConfig3 = {
  apiKey: "AIzaSyBFUkBq-uBYBvK5klZqM8ghW7d85wRr5PI",
  authDomain: "water-4af97.firebaseapp.com",
  projectId: "water-4af97",
  storageBucket: "water-4af97.firebasestorage.app",
  messagingSenderId: "685154899914",
  appId: "1:685154899914:web:f0d8fb42c3ac956cf0a133",
  measurementId: "G-7L5THC34KJ"
};

// ============================================================
// FIREBASE 4 (Water-42455)
// ============================================================
const firebaseConfig4 = {
  apiKey: "AIzaSyCTFyhncQ2aZ0r6uSkGMUAetx0ebczSNWo",
  authDomain: "water-42455.firebaseapp.com",
  projectId: "water-42455",
  storageBucket: "water-42455.firebasestorage.app",
  messagingSenderId: "725370218483",
  appId: "1:725370218483:web:0da781f5ba621f5bc01486",
  measurementId: "G-F8ESWG5FJG"
};

// ============================================================
// FIREBASE 5 (Water-4c611)
// ============================================================
const firebaseConfig5 = {
  apiKey: "AIzaSyBWXiw1X_aDj9JAIPIbduzpEAT43sDep5A",
  authDomain: "payroll-1fcab.firebaseapp.com",
  projectId: "payroll-1fcab",
  storageBucket: "payroll-1fcab.firebasestorage.app",
  messagingSenderId: "456428073034",
  appId: "1:456428073034:web:50945d1f9ebb55998736b3",
  measurementId: "G-D3EZH4T3JN"
};

// ============================================================
// FIREBASE 6 (Water-1c122) ← NEW
// ============================================================
const firebaseConfig6 = {
  apiKey: "AIzaSyAjIaCkqgKWUGNxhMClbeD5pYLMoxaqA9o",
  authDomain: "water-1c122.firebaseapp.com",
  projectId: "water-1c122",
  storageBucket: "water-1c122.firebasestorage.app",
  messagingSenderId: "588142511673",
  appId: "1:588142511673:web:88c4b4e81dfaf7d75eafe8",
  measurementId: "G-8W2XLD551H"
};

// ============================================================
// INITIALIZE APPS
// ============================================================
const app1 = initializeApp(firebaseConfig1, 'app1');
const app2 = initializeApp(firebaseConfig2, 'app2');
const app3 = initializeApp(firebaseConfig3, 'app3');
const app4 = initializeApp(firebaseConfig4, 'app4');
const app5 = initializeApp(firebaseConfig5, 'app5');
const app6 = initializeApp(firebaseConfig6, 'app6');   // ← NEW

// Auth only sa app1 (main auth)
export const auth = getAuth(app1);

// Firestore instances
export const db = getFirestore(app1);   // Server 1
export const db2 = getFirestore(app2);  // Server 2
export const db3 = getFirestore(app3);  // Server 3
export const db4 = getFirestore(app4);  // Server 4
export const db5 = getFirestore(app5);  // Server 5
export const db6 = getFirestore(app6);  // Server 6 ← NEW

// ============================================================
// HELPER: Get DB instance by server key
// ============================================================
export const getDbByServer = (server) => {
  switch (server) {
    case 'server2': return db2;
    case 'server3': return db3;
    case 'server4': return db4;
    case 'server5': return db5;
    case 'server6': return db6;   // ← NEW
    case 'server1':
    default:
      return db;
  }
};

// ============================================================
// HELPER: Get server label
// ============================================================
export const getServerLabel = (server) => {
  switch (server) {
    case 'server2': return 'Server 2';
    case 'server3': return 'Server 3';
    case 'server4': return 'Server 4';
    case 'server5': return 'Server 5';
    case 'server6': return 'Server 6';   // ← NEW
    case 'server1':
    default:
      return 'Server 1';
  }
};

// ============================================================
// HELPER: Get server color (para sa UI)
// ============================================================
export const getServerColor = (server) => {
  switch (server) {
    case 'server2': return '#DC2626';
    case 'server3': return '#7C3AED';
    case 'server4': return '#059669';
    case 'server5': return '#D97706';
    case 'server6': return '#0891B2';   // ← NEW (Cyan/Teal)
    case 'server1':
    default:
      return '#194752';
  }
};

// ============================================================
// HELPER: List of all servers
// ============================================================
export const ALL_SERVERS = ['server1', 'server2', 'server3', 'server4', 'server5', 'server6'];

// Default server (Server 1 ra ang i-load inig mount)
export const DEFAULT_SERVER = 'server1';

// ============================================================
// SERVER CONFIGS - Para sa loops ug dropdown
// ============================================================
export const SERVER_CONFIGS = [
  { key: 'server1', label: 'Server 1', db: db,  project: 'watersystem-bb153', color: '#194752' },
  { key: 'server2', label: 'Server 2', db: db2, project: 'payroll-e3cc5',       color: '#194752' },
  { key: 'server3', label: 'Server 3', db: db3, project: 'water-4af97',         color: '#194752' },
  { key: 'server4', label: 'Server 4', db: db4, project: 'water-42455',         color: '#194752' },
  { key: 'server5', label: 'Server 5', db: db5, project: 'water-4c611',         color: '#194752' },
  { key: 'server6', label: 'Server 6', db: db6, project: 'water-1c122',         color: '#194752' },   // ← NEW
];

export { app1, app2, app3, app4, app5, app6 };