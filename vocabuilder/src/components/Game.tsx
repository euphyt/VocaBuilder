// src/components/Game.tsx
import { useEffect, useState } from "react";
import {
  getRandomWords,
  type LevelKey,
} from "../lib/getRandomWords";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useUser } from "../context/UserContext";

type GameState = "idle" | "loading" | "playing";

interface Pair {
  word: string;
  definition: string;
}

const LEVEL_OPTIONS: LevelKey[] = ["Beginner", "Intermediate", "Advanced"];
const PAIRS_PER_ROUND = 6;

export default function Game() {
  const [level, setLevel] = useState<LevelKey>("Beginner");
  const [state, setState] = useState<GameState>("idle");

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [leftOrder, setLeftOrder] = useState<number[]>([]);
  const [rightOrder, setRightOrder] = useState<number[]>([]);
  const [matches, setMatches] = useState<boolean[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(0);

  const { addExp } = useUser();

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  async function startRound(selectedLevel: LevelKey) {
    setState("loading");
    setError(null);
    setMessage(null);
    setSelectedLeft(null);

    try {
      // getRandomWords uses the same Firestore-based data as Library & Quiz
      const words = await getRandomWords(selectedLevel, PAIRS_PER_ROUND * 2);
      const usable = words
        .filter((w) => w.definition && typeof w.definition === "string")
        .slice(0, PAIRS_PER_ROUND);

      if (usable.length < 3) {
        setError(
          "Not enough words with definitions found for this level. Try another level."
        );
        setState("idle");
        return;
      }

      const newPairs: Pair[] = usable.map((w) => ({
        word: w.word,
        definition: w.definition,
      }));

      const count = newPairs.length;
      const indices = Array.from({ length: count }, (_, i) => i);

      const left = shuffle(indices); // order for words
      const right = shuffle(indices); // order for definitions

      setPairs(newPairs);
      setLeftOrder(left);
      setRightOrder(right);
      setMatches(new Array(count).fill(false));
      setSelectedLeft(null);
      setMessage(null);
      setState("playing");
      setRoundNumber((r) => r + 1);
    } catch (err) {
      console.error("Failed to load match game words:", err);
      setError("Something went wrong loading the game. Please try again.");
      setState("idle");
    }
  }

  function handleStart() {
    setScore(0);
    setRoundNumber(0);
    startRound(level);
  }

  function handleSelectLeft(pairIndex: number) {
    if (state !== "playing") return;
    if (matches[pairIndex]) return; // already matched
    setSelectedLeft(pairIndex);
    setMessage(null);
  }

  async function handleSelectRight(pairIndexFromRight: number) {
    if (state !== "playing") return;
    if (selectedLeft === null) return;
    if (matches[pairIndexFromRight]) return;

    const leftIndex = selectedLeft;
    setSelectedLeft(null);

    if (leftIndex === pairIndexFromRight) {
      // correct match
      const updated = matches.slice();
      updated[leftIndex] = true;
      setMatches(updated);
      setScore((s) => s + 1);
      setMessage("Correct match! ✨");

      // Small XP reward for each correct pair
      if (addExp) {
        try {
          await addExp(4);
        } catch (err) {
          console.error("Failed to add EXP from match game:", err);
        }
      }
    } else {
      // wrong match
      setMessage("Not a match. Try again!");
    }
  }

  const allMatched =
    matches.length > 0 && matches.every((m) => m === true);

  function handleNextRound() {
    startRound(level);
  }

  // Reset when level changes
  useEffect(() => {
    setState("idle");
    setPairs([]);
    setLeftOrder([]);
    setRightOrder([]);
    setMatches([]);
    setSelectedLeft(null);
    setMessage(null);
    setError(null);
    setScore(0);
    setRoundNumber(0);
  }, [level]);

  return (
    <section className="space-y-4">
      <Card className="border-[#E8DFD4] bg-[#FFFBF5]">
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#3D2817]">
              Match the following
            </CardTitle>
            <div className="text-xs text-right text-[#7a6c5c] space-y-1">
              <p>Match the words on the left with the correct meanings on the right.</p>
              <p>
                Score: <span className="font-semibold text-[#3D2817]">{score}</span> ·
                Round: <span className="font-semibold text-[#3D2817]">{roundNumber}</span>
              </p>
            </div>
          </div>

          {/* Level selector + start button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                  disabled={state === "loading" || state === "playing"}
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>

            {state === "idle" && (
              <Button
                type="button"
                onClick={handleStart}
                className="rounded-full bg-[#1E3A5F] px-6 py-2 text-sm font-medium text-white hover:bg-[#162c46]"
              >
                Start matching
              </Button>
            )}

            {state === "playing" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => startRound(level)}
              >
                New set
              </Button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {state === "loading" && (
            <p className="text-sm text-[#5C4B3B]">
              Preparing your pairs… pulling words and meanings.
            </p>
          )}

          {state === "playing" && pairs.length > 0 && (
            <div className="space-y-4">
              {/* Columns: words / meanings */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Left: words */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#7a6c5c]">
                    Words
                  </p>
                  {leftOrder.map((pairIndex, i) => {
                    const pair = pairs[pairIndex];
                    const isMatched = matches[pairIndex];
                    const isSelected = selectedLeft === pairIndex;

                    return (
                      <button
                        key={pairIndex}
                        type="button"
                        onClick={() => handleSelectLeft(pairIndex)}
                        disabled={isMatched}
                        className={`
                          flex items-center gap-3 w-full rounded-2xl border px-3 py-2 text-left text-sm
                          transition
                          ${
                            isMatched
                              ? "bg-[#DFF3E4] border-[#A9D3B5] text-[#2F5E3A]"
                              : isSelected
                              ? "bg-[#1E3A5F] border-[#1E3A5F] text-white"
                              : "bg-white border-[#E8DFD4] text-[#3D2817] hover:bg-[#F5F1EB]"
                          }
                        `}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E8DD] text-[0.7rem] font-semibold text-[#3D2817]">
                          {i + 1}
                        </span>
                        <span>{pair.word}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: definitions */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#7a6c5c]">
                    Meanings
                  </p>
                  {rightOrder.map((pairIndex, i) => {
                    const pair = pairs[pairIndex];
                    const isMatched = matches[pairIndex];

                    return (
                      <button
                        key={pairIndex}
                        type="button"
                        onClick={() => handleSelectRight(pairIndex)}
                        disabled={isMatched}
                        className={`
                          flex items-start gap-3 w-full rounded-2xl border px-3 py-2 text-left text-xs sm:text-sm
                          transition
                          ${
                            isMatched
                              ? "bg-[#DFF3E4] border-[#A9D3B5] text-[#2F5E3A]"
                              : "bg-white border-[#E8DFD4] text-[#3D2817] hover:bg-[#F5F1EB]"
                          }
                        `}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E8DD] text-[0.7rem] font-semibold text-[#3D2817]">
                          {i + 1}
                        </span>
                        <span>{pair.definition}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && (
                <p className="text-xs text-[#7a6c5c]">{message}</p>
              )}

              {allMatched && (
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs text-[#3D2817] border border-[#E8DFD4]">
                  <span>All pairs matched! Great job 🎉</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNextRound}
                    className="rounded-full bg-[#1E3A5F] px-4 py-1 text-xs font-medium text-white hover:bg-[#162c46]"
                  >
                    New round
                  </Button>
                </div>
              )}
            </div>
          )}

          {state === "idle" && !error && (
            <p className="text-xs text-[#7a6c5c]">
              Choose a level and click &quot;Start matching&quot; to begin. Match each
              word on the left with its correct meaning on the right.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
