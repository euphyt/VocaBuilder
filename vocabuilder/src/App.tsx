// src/App.tsx
import { useEffect, useState } from "react";
import { BookMarked, Dumbbell, LogOut, User as UserIcon } from "lucide-react";

import vocabLogo from "./assets/vocab-logo.png"; // logo image

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import Library from "./components/Library";
import Activities from "./components/Activities";
import Profile from "./components/Profile";
import SavedWords from "./components/SavedWords";
import { Button } from "./components/ui/button";
import { logoutUser } from "./firebase_main";
import { useUser } from "./context/UserContext";

type Tab = "library" | "activities" | "profile" | "saved";
type AuthView = "login" | "signup";

interface ProgressStorage {
  date: string;
  count: number;
}

export default function App() {
  const { firebaseUser, loading } = useUser();

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "library";
    const stored = window.localStorage.getItem("vb_active_tab");
    if (
      stored === "library" ||
      stored === "activities" ||
      stored === "profile" ||
      stored === "saved"
    ) {
      return stored;
    }
    return "library";
  });

  const [authView, setAuthView] = useState<AuthView>("login");

  // 🔹 today's progress
  const [wordsSeenToday, setWordsSeenToday] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem("vb_words_progress");
      if (!raw) return 0;

      const parsed = JSON.parse(raw) as ProgressStorage;
      const today = new Date().toISOString().slice(0, 10);

      if (parsed.date === today) return parsed.count;
      return 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vb_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const payload: ProgressStorage = { date: today, count: wordsSeenToday };
    window.localStorage.setItem("vb_words_progress", JSON.stringify(payload));
  }, [wordsSeenToday]);

  const handleWordLearned = () => {
    setWordsSeenToday((prev) => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
    setActiveTab("library");
    setAuthView("login");
  };

  // ---------- LOADING ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB] text-[#3D2817]">
        <p className="text-sm">Checking your session…</p>
      </div>
    );
  }

  // ---------- NOT LOGGED IN ----------
  if (!firebaseUser) {
    if (authView === "login") {
      return (
        <Login
          onLogin={() => {}}
          onSwitchToSignup={() => setAuthView("signup")}
        />
      );
    }

    if (authView === "signup") {
      return (
        <Signup
          onSignup={() => setAuthView("login")}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }
  }

  // ---------- LOGGED IN ----------
  return (
    <div className="min-h-screen bg-[#F5F1EB] text-[#3D2817]">
      <header className="border-b border-[#E8DFD4] bg-[#FDFBF8] shadow-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          {/* Clickable logo + title */}
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setActiveTab("library")}
          >
            <img
              src={vocabLogo}
              alt="VocabBuilder Logo"
              className="h-20 w-17 object-contain"
            />
            <span className="text-xl font-bold text-[#1E3A5F]">
            VocabBuilder
            </span>
          </button>

          <div className="flex items-center gap-6">
            <div className="text-right space-y-1">
              <div>
                <p className="text-xs text-[#7A6C5C]">Today&apos;s Progress</p>
                <p className="text-sm font-semibold text-[#1E3A5F]">
                  Word count: {wordsSeenToday}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className="text-[0.7rem] text-[#1E3A5F] underline underline-offset-2 hover:text-[#162c46]"
              >
                Saved words
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* nav pills */}
        <div className="container mx-auto px-6 pb-4">
          <nav className="flex gap-3">
            <Button
              onClick={() => setActiveTab("library")}
              variant="ghost"
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border
                ${
                  activeTab === "library"
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-sm"
                    : "border-transparent text-[#3D2817] hover:bg-[#F5F1EB]"
                }`}
            >
              <BookMarked className="h-4 w-4" />
              Library
            </Button>

            <Button
              onClick={() => setActiveTab("activities")}
              variant="ghost"
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border
                ${
                  activeTab === "activities"
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-sm"
                    : "border-transparent text-[#3D2817] hover:bg-[#F5F1EB]"
                }`}
            >
              <Dumbbell className="h-4 w-4" />
              Activities
            </Button>

            <Button
              onClick={() => setActiveTab("profile")}
              variant="ghost"
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border
                ${
                  activeTab === "profile"
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-sm"
                    : "border-transparent text-[#3D2817] hover:bg-[#F5F1EB]"
                }`}
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {activeTab === "library" && (
          <Library onWordLearned={handleWordLearned} />
        )}
        {activeTab === "activities" && <Activities />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "saved" && (
          <section className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-2xl font-semibold text-[#3D2817]">
                Saved words
              </h2>
              <p className="text-sm text-[#7a6c5c]">
                Review all the words you&apos;ve favorited from the Library.
              </p>
            </header>
            <SavedWords />
          </section>
        )}
      </main>
    </div>
  );
}
