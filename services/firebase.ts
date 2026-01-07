import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, set, get, child } from 'firebase/database';

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

// Disable Firebase in AI Studio preview environments to prevent errors
const isPreviewEnv = window.location.hostname.includes('googleusercontent.com') || 
                     window.location.hostname.includes('webcontainer.io');

let app;
let auth: any;
let db: any;

if (!isPreviewEnv) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.log("Firebase disabled in preview environment");
}

const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  if (!auth) {
    alert("Authentication is disabled in this preview environment.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in", error);
    throw error;
  }
};

export const signOut = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

export const saveUserData = async (userId: string, data: any) => {
  if (!db) return;
  const userRef = ref(db, 'users/' + userId);
  await set(userRef, data);
};

export const getUserData = async (userId: string) => {
  if (!db) return null;
  const dbRef = ref(db);
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

export { auth, db };