// src/components/SavedWords.tsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase_main";
import { useUser } from "../context/UserContext";
import { Card, CardContent, CardTitle } from "./ui/card";

interface SavedWord {
  id: string;
  word: string;
  level: string;
  definition: string;
  example?: string;
}

export default function SavedWords() {
  const { firebaseUser } = useUser();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWord, setActiveWord] = useState<SavedWord | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setWords([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const ref = collection(db, "users", firebaseUser.uid, "favorites");
        const snap = await getDocs(ref);
        const arr: SavedWord[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            word: data.word,
            level: data.level,
            definition: data.definition,
            example: data.example,
          };
        });
        setWords(arr);
        setActiveWord(arr[0] ?? null);
      } catch (err) {
        console.error("Failed to load saved words:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser]);

  if (!firebaseUser) {
    return (
      <p className="text-sm text-muted-foreground">
        Log in to save and review words.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading saved words…
      </p>
    );
  }

  if (!words.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No saved words yet. Use &quot;Save word for review&quot; in the
        Library to build your review list.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#E8DFD4] bg-white">
        <CardContent className="space-y-4 py-4">
          <CardTitle className="text-sm text-[#3D2817]">
            Your saved words
          </CardTitle>
          <p className="text-xs text-[#7a6c5c]">
            Tap a circle to focus on a word. The definition and example will
            show below.
          </p>

          {/* Circle grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {words.map((w) => {
              const isActive = activeWord?.id === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWord(w)}
                  className={`
                    flex flex-col items-center gap-2 focus:outline-none
                  `}
                >
                  <div
                    className={`
                      h-24 w-24 sm:h-28 sm:w-28
                      rounded-full
                      flex items-center justify-center text-center px-3
                      transition
                      shadow-sm border
                      ${
                        isActive
                          ? "bg-[#1E3A5F] border-[#1E3A5F] text-white scale-105"
                          : "bg-[#FFF7EC] border-[#E8DFD4] text-[#3D2817] hover:scale-105"
                      }
                    `}
                  >
                    <span className="text-sm sm:text-base font-semibold leading-tight">
                      {w.word}
                    </span>
                  </div>
                  <span className="text-[0.7rem] text-[#7a6c5c] uppercase tracking-wide">
                    {w.level}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active word details */}
      {activeWord && (
        <Card className="border-[#E8DFD4] bg-[#FFFBF5]">
          <CardContent className="space-y-2 py-4">
            <p className="text-sm font-semibold text-[#3D2817]">
              {activeWord.word}
            </p>
            <p className="text-xs text-[#4B3A2B]">
              {activeWord.definition}
            </p>
            {activeWord.example && (
              <p className="text-xs italic text-[#7a6c5c]">
                “{activeWord.example}”
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
