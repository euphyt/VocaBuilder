// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyBA5_R4n_nD7Rq3M31Z77aWWWi6-x0pI1A",
    authDomain: "s2-t9csce3444fall20225.firebaseapp.com",
    projectId: "s2-t9csce3444fall20225",
    storageBucket: "s2-t9csce3444fall20225.firebasestorage.app",
    messagingSenderId: "980671872167",
    appId: "1:980671872167:web:5cdd1cb4b5b3676be1af82"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
