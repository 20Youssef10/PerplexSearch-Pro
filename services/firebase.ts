import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB2B86soPpQQ93zxhrenJZkGxXrTXw3u6I",
  authDomain: "gen-lang-client-0014100463.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0014100463-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0014100463",
  storageBucket: "gen-lang-client-0014100463.firebasestorage.app",
  messagingSenderId: "819971495566",
  appId: "1:819971495566:web:38dc9a57ba9a43b9585bdf",
  measurementId: "G-JRZW8F78BB"
};

const VAPID_KEY = "BHA-1ifS2Oioz7WsNVpsW9c3QNmVciMEIWNLu-mNv8yoeda6HmJsfkTpMVchhKZfKZXzXX4oCCRSsbsSnohsYKU";

// Disable Firebase in AI Studio preview environments to prevent errors
const isPreviewEnv = window.location.hostname.includes('googleusercontent.com') || 
                     window.location.hostname.includes('webcontainer.io');

let app;
let auth: any;
let rtdb: any;
let firestore: any;
let analytics: any;
let remoteConfig: any;
let messaging: any;

if (!isPreviewEnv) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    rtdb = getDatabase(app);
    firestore = getFirestore(app);
    analytics = getAnalytics(app);
    remoteConfig = getRemoteConfig(app);
    
    // Messaging requires service worker/HTTPS, often fails in simple dev envs
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
         messaging = getMessaging(app);
      }
    } catch (e) {
      console.warn("Firebase Messaging init failed (likely due to env):", e);
    }

  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.log("Firebase disabled in preview environment");
}

const googleProvider = new GoogleAuthProvider();

// --- Auth Providers ---

export const signInWithGoogle = async () => {
  if (!auth) {
    alert("Authentication is disabled in this preview environment.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInEmail = async (email: string, pass: string) => {
  if (!auth) return null;
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signUpEmail = async (email: string, pass: string) => {
  if (!auth) return null;
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInGuest = async () => {
  if (!auth) return null;
  return signInAnonymously(auth);
};

// Backwards compatibility alias
export const signIn = signInWithGoogle;

export const signOut = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

// --- Database & Persistence ---

export const saveUserData = async (userId: string, data: any) => {
  if (!rtdb) return;
  const userRef = ref(rtdb, 'users/' + userId);
  await set(userRef, data);
};

export const getUserData = async (userId: string) => {
  if (!rtdb) return null;
  const dbRef = ref(rtdb);
  const snapshot = await get(child(dbRef, `users/${userId}`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- Cloud Messaging ---

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (e) {
    console.error("Error requesting notification permission:", e);
  }
  return null;
};

// Export all services for direct usage if needed
export { auth, rtdb, firestore, analytics, remoteConfig, messaging };