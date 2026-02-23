import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// We wrap this in a check to ensure it only runs if config is present (avoid crashing if envs are missing)
let app;
let analytics;

try {
  if (firebaseConfig.apiKey) {
      app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      console.log('Firebase initialized successfully');
  } else {
      console.warn('Firebase configuration missing in environment variables');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { app, analytics };
