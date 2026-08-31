// src/context/UserContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase_main";

export type LevelKey = "Beginner" | "Intermediate" | "Advanced";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string;
  exp: number;
  level: number;
  completedLevels: LevelKey[];
}

interface UserContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  addExp: (amount: number) => Promise<void>;
  markLevelCompleted: (level: LevelKey) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // called once user is authenticated
  async function ensureUserDocument(user: FirebaseUser) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: "",
        exp: 0,
        level: 1,
        completedLevels: [],
      };

      await setDoc(ref, {
        ...newProfile,
        createdAt: serverTimestamp(),
      });

      return newProfile;
    }

    const data = snap.data();
    return {
      uid: user.uid,
      email: data.email ?? user.email,
      displayName: data.displayName ?? user.displayName ?? null,
      avatarUrl: data.avatarUrl,
      exp: data.exp ?? 0,
      level: data.level ?? 1,
      completedLevels: data.completedLevels ?? [],
    } as UserProfile;
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setFirebaseUser(user);

        const p = await ensureUserDocument(user);
        setProfile(p);
      } catch (err) {
        console.error("UserContext: failed:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function refreshProfile() {
    if (!firebaseUser) return;

    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    setProfile({
      uid: firebaseUser.uid,
      email: data.email,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      exp: data.exp,
      level: data.level,
      completedLevels: data.completedLevels ?? [],
    });
  }

  // simple XP → Level formula
  const xpToLevel = (xp: number) => Math.floor(xp / 100) + 1;

  async function addExp(amount: number) {
    if (!firebaseUser || !profile) return;

    const newExp = profile.exp + amount;
    const newLevel = xpToLevel(newExp);

    const ref = doc(db, "users", firebaseUser.uid);
    await updateDoc(ref, { exp: newExp, level: newLevel });

    setProfile({ ...profile, exp: newExp, level: newLevel });
  }

  async function markLevelCompleted(level: LevelKey) {
    if (!firebaseUser || !profile) return;

    if (profile.completedLevels.includes(level)) return;

    const updated = [...profile.completedLevels, level];

    const ref = doc(db, "users", firebaseUser.uid);
    await updateDoc(ref, { completedLevels: updated });

    setProfile({ ...profile, completedLevels: updated });
  }

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        addExp,
        markLevelCompleted,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
