import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Enable offline persistence for better reliability
// This allows the app to work even when network is unstable
let persistenceEnabled = false;

if (!persistenceEnabled) {
  enableIndexedDbPersistence(db).then(() => {
    persistenceEnabled = true;
    console.log('🔥 Firebase initialized with Firestore persistence');
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Persistence not supported in this browser');
    } else {
      console.warn('⚠️ Persistence error:', err.message);
    }
    console.log('🔥 Firebase initialized without persistence');
  });
} else {
  console.log('🔥 Firebase already initialized');
}

export default app;
