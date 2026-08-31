// src/components/Flashcards.tsx
import { useEffect, useState } from "react";
import {
  getRandomWords,
  type LevelKey,
  type VocabWord,
} from "../lib/getRandomWords";
import { useUser } from "../context/UserContext";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const LEVEL_OPTIONS: LevelKey[] = ["Beginner", "Intermediate", "Advanced"];

export default function Flashcards() {
  const { firebaseUser, addExp } = useUser();

  const [level, setLevel] = useState<LevelKey>("Beginner");
  const [cards, setCards] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [endMessage, setEndMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // load a big random batch of flashcards for the selected level
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setEndMessage(null);
      setShowBack(false);
      setIndex(0);

      try {
        // no count → getRandomWords returns a big randomized list
        const words = await getRandomWords(level);
        if (!words.length) {
          setError("No words available for this level yet.");
          setCards([]);
          return;
        }
        setCards(words);
      } catch (err) {
        console.error("Failed to load flashcards:", err);
        setError("Something went wrong while loading flashcards.");
        setCards([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [level]);

  const current = cards[index];

  const handleFlip = () => {
    if (!current) return;
    setShowBack((prev) => !prev);
  };

  const handleNext = () => {
    if (!cards.length || !current) return;

    const isLast = index >= cards.length - 1;

    // small XP reward for moving to a new card (front to next card)
    if (!isLast && addExp) {
      void addExp(3);
    }

    if (isLast) {
      setEndMessage("You’ve seen all flashcards for this level.");
      return;
    }

    setIndex((i) => i + 1);
    setShowBack(false);
    setEndMessage(null);
  };

  const handlePrev = () => {
    if (!cards.length) return;
    if (index === 0) return;
    setIndex((i) => i - 1);
    setShowBack(false);
    setEndMessage(null);
  };

  if (!firebaseUser) {
    return (
      <p className="text-sm text-muted-foreground">
        Log in to use flashcards and track your progress.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <CardTitle className="text-lg text-[#3D2817]">
          Flashcards
        </CardTitle>
        <p className="text-sm text-[#7a6c5c]">
          Flip the card to see the definition. Work through as many cards as you like.
        </p>
      </header>

      {/* Level selector */}
      <div className="inline-flex gap-2 rounded-full bg-[#F3E8DD] p-1">
        {LEVEL_OPTIONS.map((lvl) => (
          <Button
            key={lvl}
            type="button"
            size="sm"
            variant={level === lvl ? "default" : "ghost"}
            className={
              level === lvl
                ? "bg-[#1E3A5F] text-white hover:bg-[#162c46]"
                : "text-[#3D2817]"
            }
            disabled={loading}
            onClick={() => setLevel(lvl)}
          >
            {lvl}
          </Button>
        ))}
      </div>

      <Card className="border-[#E8DFD4] bg-[#FFFBF5]">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center justify-between text-xs text-[#7a6c5c] mb-2">
            <span>Level: {level}</span>
            <span>
              Card {cards.length ? index + 1 : 0} of {cards.length}
            </span>
          </div>

          {loading && (
            <p className="text-sm text-[#7a6c5c]">Loading flashcards…</p>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {!loading && !error && !current && (
            <p className="text-sm text-[#7a6c5c]">
              No flashcards available for this level.
            </p>
          )}

          {!loading && !error && current && (
            <>
              <div className="rounded-3xl bg-white p-6 shadow-sm min-h-[180px] flex flex-col justify-center">
                {!showBack ? (
                  <>
                    <p className="text-xs text-[#7a6c5c] mb-1">
                      Word
                    </p>
                    <p className="text-3xl font-semibold text-[#3D2817]">
                      {current.word}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#7a6c5c] mb-1">
                      Definition
                    </p>
                    <p className="text-[16px] text-[#4A3A2A]">
                      {current.definition}
                    </p>
                    {current.example && (
                      <p className="text-[14px] italic text-[#7a6c5c]">
                        “{current.example}”
                      </p>
                    )}
                    {current.synonyms?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-xs font-semibold text-[#7a6c5c]">
                          Synonyms:
                        </span>
                        {current.synonyms.slice(0, 5).map((syn) => (
                          <span
                            key={syn}
                            className="rounded-full bg-[#F3E8DD] px-3 py-1 text-xs text-[#3D2817]"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={index === 0}
                >
                  Previous
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleFlip}
                >
                  {showBack ? "Hide definition" : "Show definition"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1E3A5F] text-white hover:bg-[#162c46]"
                  onClick={handleNext}
                >
                  Next
                </Button>
              </div>

              {endMessage && (
                <p className="pt-2 text-xs text-[#7a6c5c]">
                  {endMessage}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
