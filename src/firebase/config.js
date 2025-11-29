// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArhDhlF3sVq8MPCIS8bMgqRK9qE7eXLog",
  authDomain: "codebud-e06c7.firebaseapp.com",
  projectId: "codebud-e06c7",
  storageBucket: "codebud-e06c7.firebasestorage.app",
  messagingSenderId: "916303321378",
  appId: "1:916303321378:web:31db1537a2e97eecf82d7b",
  measurementId: "G-YDS78LQFTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in production)
let analytics = null;
try {
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics not initialized:', error.message);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export { analytics };
export default app;
