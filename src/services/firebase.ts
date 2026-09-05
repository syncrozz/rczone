import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import appletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "AIzaSyAILrcL4QlS-EwpitezwRKzxq9dK7B_Wvw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "syncrozz-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "syncrozz-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "syncrozz-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "165207391688",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:165207391688:web:e33d816413e8a927c4d4fd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || "G-L8TM5MX4YD",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
};

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseDb = (): Firestore | null => {
  if (!db) {
    const initializedApp = getFirebaseApp();
    if (initializedApp) {
      const dbId = appletConfig.firestoreDatabaseId;
      if (dbId && dbId !== '(default)' && !dbId.startsWith('ai-studio-')) {
        db = getFirestore(initializedApp, dbId);
      } else {
        db = getFirestore(initializedApp);
      }
    }
  }
  return db;
};

export const getFirebaseAuth = (): Auth | null => {
  if (!auth) {
    const initializedApp = getFirebaseApp();
    if (initializedApp) {
      auth = getAuth(initializedApp);
    }
  }
  return auth;
};

export const initAnalytics = async (): Promise<Analytics | null> => {
  if (analytics) return analytics;
  try {
    const supported = await isSupported();
    if (supported) {
      const initializedApp = getFirebaseApp();
      if (initializedApp) {
        analytics = getAnalytics(initializedApp);
      }
    }
  } catch (err) {
    console.warn('Firebase Analytics initialization skipped:', err);
  }
  return analytics;
};

// Initialize analytics in browser environment asynchronously
if (typeof window !== 'undefined') {
  initAnalytics();
}


