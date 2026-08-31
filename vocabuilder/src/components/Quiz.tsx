// src/components/Quiz.tsx
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase_main";
import {
  getRandomWords,
  type LevelKey,
  type VocabWord,
} from "../lib/getRandomWords";
import { useUser } from "../context/UserContext";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const LEVEL_OPTIONS: LevelKey[] = ["Beginner", "Intermediate", "Advanced"];
const MAX_SOURCE_WORDS = 15;
const QUESTIONS_PER_QUIZ = 10;
const PERFECT_QUIZZES_FOR_CERT = 10;

type QuizState = "idle" | "loading" | "in-progress" | "finished";

interface Question {
  word: string;
  correctDefinition: string;
  options: string[];
}

interface QuizAttempt {
  id: string;
  level: LevelKey;
  correct: number;
  total: number;
  isPerfect: boolean;
  createdAt?: Date | null;
}

const LEVEL_LABELS: Record<LevelKey, string> = {
  Beginner: "Beginner",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
};

export default function Quiz() {
  const { firebaseUser, addExp } = useUser();

  const [level, setLevel] = useState<LevelKey>("Beginner");
  const [quizState, setQuizState] = useState<QuizState>("idle");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);

  // quiz record / stats
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [perfectCount, setPerfectCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ------------- HELPERS -------------

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildQuestions(words: VocabWord[]): Question[] {
    const usable = words.filter(
      (w) => w.definition && typeof w.definition === "string"
    );
    const selected = usable.slice(0, Math.min(QUESTIONS_PER_QUIZ, usable.length));

    return selected.map((w, _, all) => {
      const distractors = shuffle(all.filter((x) => x.word !== w.word)).slice(0, 3);
      const options = shuffle([
        w.definition,
        ...distractors.map((d) => d.definition),
      ]);

      return {
        word: w.word,
        correctDefinition: w.definition,
        options,
      };
    });
  }

  // ------------- FIRESTORE STATS -------------

  async function loadHistory(currentLevel: LevelKey) {
    if (!firebaseUser) return;

    setLoadingHistory(true);
    try {
      const attemptsRef = collection(
        db,
        "users",
        firebaseUser.uid,
        "quizAttempts"
      );
      const snap = await getDocs(attemptsRef);

      const allAttempts: QuizAttempt[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          level: data.level as LevelKey,
          correct: data.correct,
          total: data.total,
          isPerfect: !!data.isPerfect,
          createdAt: data.createdAt?.toDate?.() ?? null,
        };
      });

      // Filter by level in JS
      const filtered = allAttempts
        .filter((a) => a.level === currentLevel)
        .sort((a, b) => {
          const tA = a.createdAt?.getTime() ?? 0;
          const tB = b.createdAt?.getTime() ?? 0;
          return tB - tA;
        });

      setHistory(filtered.slice(0, 10));
      setPerfectCount(filtered.filter((a) => a.isPerfect).length);
    } catch (err) {
      console.error("Failed to load quiz history:", err);
      // don’t block the UI, just skip
    } finally {
      setLoadingHistory(false);
    }
  }

  async function awardCertificateIfEnoughPerfect(currentLevel: LevelKey) {
    if (!firebaseUser) return;

    // Re-count perfect quizzes for safety
    const attemptsRef = collection(
      db,
      "users",
      firebaseUser.uid,
      "quizAttempts"
    );
    const snap = await getDocs(attemptsRef);

    const perfectForLevel = snap.docs
      .map((d) => d.data() as any)
      .filter(
        (a) =>
          a.level === currentLevel &&
          a.isPerfect === true
      ).length;

    if (perfectForLevel >= PERFECT_QUIZZES_FOR_CERT) {
      const userRef = doc(db, "users", firebaseUser.uid);
      try {
        await updateDoc(userRef, {
          completedLevels: arrayUnion(LEVEL_LABELS[currentLevel]),
        });
      } catch (err) {
        console.error("Failed to update completedLevels:", err);
      }
    }
  }

  async function saveQuizResult(
    currentLevel: LevelKey,
    correct: number,
    total: number
  ) {
    if (!firebaseUser) return;

    setSavingResult(true);
    try {
      const attemptsRef = collection(
        db,
        "users",
        firebaseUser.uid,
        "quizAttempts"
      );
      const isPerfect = correct === total;

      const docRef = await addDoc(attemptsRef, {
        level: currentLevel,
        correct,
        total,
        isPerfect,
        createdAt: serverTimestamp(),
      });

      // Update local history immediately so user sees it right away
      const newAttempt: QuizAttempt = {
        id: docRef.id,
        level: currentLevel,
        correct,
        total,
        isPerfect,
        createdAt: new Date(),
      };

      setHistory((prev) => [newAttempt, ...prev].slice(0, 10));
      if (isPerfect) {
        setPerfectCount((prev) => prev + 1);
      }

      // XP for quiz
      if (addExp) {
        const xp = correct * 5;
        try {
          await addExp(xp);
        } catch (err) {
          console.error("Failed to add XP from quiz:", err);
        }
      }

      // check certificate condition
      if (isPerfect) {
        await awardCertificateIfEnoughPerfect(currentLevel);
      }
    } catch (err) {
      console.error("Failed to save quiz result:", err);
      alert("Could not save quiz result. Your record may not be stored.");
    } finally {
      setSavingResult(false);
    }
  }

  // ------------- QUIZ LOGIC -------------

  async function startQuiz() {
    setError(null);
    setQuizState("loading");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);

    try {
      const words = await getRandomWords(level, MAX_SOURCE_WORDS);
      if (!words.length) {
        setError("No words available for this level.");
        setQuizState("idle");
        return;
      }

      const qs = buildQuestions(words);
      if (!qs.length) {
        setError("Not enough words with definitions to build a quiz.");
        setQuizState("idle");
        return;
      }

      setQuestions(qs);
      setQuizState("in-progress");
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError("Something went wrong while starting the quiz.");
      setQuizState("idle");
    }
  }

  function handleOptionClick(option: string) {
    if (quizState !== "in-progress") return;
    if (!questions[currentIndex]) return;
    if (selectedOption !== null) return; // already answered

    setSelectedOption(option);

    const current = questions[currentIndex];
    if (option === current.correctDefinition) {
      setCorrectCount((c) => c + 1);
    }
  }

  async function handleNextQuestion() {
    if (!questions[currentIndex]) return;

    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      // NOTE: correctCount does not yet include this question if it was just answered correct,
      // because setCorrectCount is async. So we compute effectiveCorrect here.
      const current = questions[currentIndex];
      const wasCorrect = selectedOption === current.correctDefinition;
      const effectiveCorrect = wasCorrect ? correctCount + 1 : correctCount;

      setCorrectCount(effectiveCorrect);
      setQuizState("finished");

      await saveQuizResult(level, effectiveCorrect, questions.length);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    }
  }

  function handleRestart() {
    setQuizState("idle");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
  }

  // ------------- EFFECTS -------------

  useEffect(() => {
    if (firebaseUser) {
      void loadHistory(level);
    } else {
      setHistory([]);
      setPerfectCount(0);
    }
  }, [firebaseUser, level]);

  // ------------- RENDER -------------

  const currentQuestion = questions[currentIndex] ?? null;

  if (!firebaseUser) {
    return (
      <p className="text-sm text-muted-foreground">
        Log in to take quizzes and see your quiz record.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="border-[#E8DFD4] bg-[#FFFBF5]">
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-[#3D2817]">
              Quiz
            </CardTitle>

            <div className="text-xs text-[#7a6c5c] text-right space-y-1">
              <p>
                Perfect quizzes at this level:{" "}
                <span className="font-semibold text-[#3D2817]">
                  {perfectCount} / {PERFECT_QUIZZES_FOR_CERT}
                </span>
              </p>
              <p>
                Certificate after at least {PERFECT_QUIZZES_FOR_CERT} quizzes
                with 100% score at this level.
              </p>
            </div>
          </div>

          {/* Level selector + Start */}
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
                  disabled={quizState === "in-progress" || quizState === "loading"}
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>

            {quizState === "idle" && (
              <Button
                type="button"
                onClick={startQuiz}
                className="rounded-full bg-[#1E3A5F] px-6 py-2 text-sm font-medium text-white hover:bg-[#162c46]"
              >
                Start quiz
              </Button>
            )}

            {quizState === "in-progress" && questions.length > 0 && (
              <span className="text-xs text-[#7a6c5c]">
                Question {currentIndex + 1} of {questions.length}
              </span>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {quizState === "loading" && (
            <p className="text-sm text-[#5C4B3B]">
              Preparing your quiz… pulling words and definitions.
            </p>
          )}

          {/* Quiz body */}
          {quizState === "in-progress" && currentQuestion && (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-[#7a6c5c] mb-1">
                  Choose the correct definition:
                </p>
                <p className="text-2xl font-semibold text-[#3D2817]">
                  {currentQuestion.word}
                </p>
              </div>

              <div className="grid gap-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option;
                  const isCorrect =
                    option === currentQuestion.correctDefinition;
                  const showFeedback = selectedOption !== null;

                  let variant: "default" | "outline" | "destructive" | "ghost" =
                    "outline";

                  if (showFeedback) {
                    if (isCorrect) variant = "default";
                    else if (isSelected && !isCorrect) variant = "destructive";
                    else variant = "outline";
                  }

                  return (
                    <Button
                      key={option}
                      type="button"
                      variant={variant}
                      className="justify-start rounded-2xl px-4 py-3 text-xs sm:text-sm whitespace-normal text-left"
                      disabled={selectedOption !== null}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>

              {selectedOption && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span
                    className={
                      selectedOption === currentQuestion.correctDefinition
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {selectedOption === currentQuestion.correctDefinition
                      ? "Correct! ✨"
                      : "Not quite. The correct answer is highlighted."}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNextQuestion}
                    className="rounded-full bg-[#1E3A5F] px-4 py-1 text-xs font-medium text-white hover:bg-[#162c46]"
                  >
                    {currentIndex === questions.length - 1
                      ? "Finish quiz"
                      : "Next question"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {quizState === "finished" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-4 shadow-sm border border-[#E8DFD4]">
                <p className="text-sm font-semibold text-[#3D2817] mb-1">
                  Quiz completed!
                </p>
                <p className="text-sm text-[#5C4B3B]">
                  You scored{" "}
                  <span className="font-semibold">
                    {correctCount} / {questions.length}
                  </span>{" "}
                  on the {LEVEL_LABELS[level]} quiz.
                </p>
                {savingResult ? (
                  <p className="text-xs text-[#7a6c5c] mt-1">
                    Saving your result…
                  </p>
                ) : (
                  <p className="text-xs text-[#7a6c5c] mt-1">
                    Your quiz record has been saved.
                  </p>
                )}
                {correctCount === questions.length ? (
                  <p className="text-xs text-green-700 mt-1">
                    Perfect score! This counts toward your certificate for this
                    level.
                  </p>
                ) : (
                  <p className="text-xs text-[#7a6c5c] mt-1">
                    Get a 100% score on at least {PERFECT_QUIZZES_FOR_CERT}{" "}
                    quizzes at this level to earn your certificate.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleRestart}>
                  New quiz
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setQuizState("idle")}
                >
                  Back to level selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QUIZ RECORD SECTION */}
      <Card className="border-[#E8DFD4] bg-white">
        <CardContent className="space-y-3 py-4">
          <CardTitle className="text-sm text-[#3D2817]">
            Quiz Record – {LEVEL_LABELS[level]}
          </CardTitle>

          {loadingHistory ? (
            <p className="text-xs text-[#7a6c5c]">Loading quiz record…</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-[#7a6c5c]">
              No quizzes recorded yet for this level. Complete a quiz to see it
              here.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-[#3D2817]">
              {history.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg bg-[#FFFBF5] px-3 py-1 border border-[#F1E4D6]"
                >
                  <span>
                    {attempt.correct} / {attempt.total}{" "}
                    {attempt.isPerfect && <span>— ✅ perfect</span>}
                  </span>
                  <span className="text-[0.65rem] text-[#7a6c5c]">
                    {attempt.createdAt
                      ? attempt.createdAt.toLocaleDateString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
