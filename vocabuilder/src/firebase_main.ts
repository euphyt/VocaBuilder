// src/firebase_main.ts

import { initializeApp, FirebaseError, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} = {
  apiKey: "AIzaSyBA5_R4n_nD7Rq3M31Z77aWWWi6-x0pI1A",
  authDomain: "s2-t9csce3444fall20225.firebaseapp.com",
  projectId: "s2-t9csce3444fall20225",
  // IMPORTANT: appspot.com bucket
  storageBucket: "s2-t9csce3444fall20225.firebasestorage.app",
  messagingSenderId: "980671872167",
  appId: "1:980671872167:web:5cdd1cb4b5b3676be1af82",
};

// ---------- INITIALIZE CORE SERVICES ----------
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
}

initFirebase();

export { app, auth, db, storage };

// ---------- SIGN UP WITH EMAIL + VERIFICATION ----------
export async function signUpWithEmailVerification(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    initFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(cred.user);

    return {
      success: true,
      message:
        "✅ Signup successful! Please check your email for a verification link.",
    };
  } catch (err) {
    const error = err as FirebaseError;
    return {
      success: false,
      message: "❌ Signup failed: " + error.message,
    };
  }
}

// ---------- SIGN IN WITH VERIFICATION CHECK ----------
export async function signInWithVerification(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    initFirebase();
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      return {
        success: false,
        message: "Please verify your email before signing in.",
      };
    }

    return {
      success: true,
      message: "✅ Signed in successfully.",
    };
  } catch (err) {
    const error = err as FirebaseError;
    return {
      success: false,
      message: "❌ Sign in failed: " + error.message,
    };
  }
}

// ---------- LOG OUT ----------
export async function logoutUser(): Promise<void> {
  initFirebase();
  await signOut(auth);
}

// ---------- SUBSCRIBE TO AUTH CHANGES ----------
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  initFirebase();
  return onAuthStateChanged(auth, callback);
}
