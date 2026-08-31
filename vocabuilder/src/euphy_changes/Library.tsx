// src/components/Library.tsx
import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import {
  getRandomWords,
  type VocabWord,
  type LevelKey,
} from "../lib/getRandomWords";
import { db } from "../firebase_main";
import { useUser } from "../context/UserContext";
import { Volume2 } from "lucide-react";

const LEVEL_OPTIONS: LevelKey[] = ["Beginner", "Intermediate", "Advanced"];

interface LibraryProps {
  onWordLearned?: () => void;
}

export default function Library({ onWordLearned }: LibraryProps) {
  const [activeLevel, setActiveLevel] = useState<LevelKey>("Beginner");
  const [words, setWords] = useState<VocabWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { firebaseUser, addExp } = useUser();

  // Load a BIG random batch of words for the current level
  useEffect(() => {
    (async () => {
      setLoading(true);
      setSaveMessage(null);
      try {
        // no `count` => getRandomWords returns a large randomized list
        const w = await getRandomWords(activeLevel);
        setWords(w);
        setIndex(0);
      } catch (err) {
        console.error("Failed to load words:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeLevel]);

  const current = words[index];

  // Audio reader for the current word
    const handlePlayAudio = () => {
    if (!current?.word) return;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("SpeechSynthesis is not supported in this browser.");
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel(); // stop anything already speaking

    const utterance = new SpeechSynthesisUtterance(current.word);

    // Try to pick a nice English voice (customize these as you like)
    const voices = synth.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 1;   // 1 = normal speed
    utterance.pitch = 1;  // 1 = normal pitch
    utterance.volume = 1; // full volume

    synth.speak(utterance);
  };


  const handleNext = () => {
    if (!words.length) return;
    const nextIndex = (index + 1) % words.length;
    const wrappedAround = nextIndex <= index;

    setIndex(nextIndex);

    if (onWordLearned && !wrappedAround) {
      onWordLearned();
    }

    if (addExp && !wrappedAround) {
      // give XP only when moving forward through new words
      void addExp(5);
    }
  };

  const handlePrev = () => {
    if (!words.length) return;
    const prevIndex = (index - 1 + words.length) % words.length;
    setIndex(prevIndex);
  };

  const handleFavorite = async () => {
    setSaveMessage(null);
    if (!firebaseUser || !current) {
      setSaveMessage("Log in to save words for review.");
      return;
    }

    try {
      const favsRef = collection(
        db,
        "users",
        firebaseUser.uid,
        "favorites"
      );

      await addDoc(favsRef, {
        word: current.word,
        level: current.level,
        definition: current.definition,
        example: current.example ?? "",
        createdAt: new Date(),
      });

      setSaveMessage("Saved! You can review this word in Saved Words.");
    } catch (err) {
      console.error("Failed to save favorite word:", err);
      setSaveMessage("Could not save this word. Try again.");
    }
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-[#3D2817]">
          Library
        </h2>
        <p className="text-sm text-[#7a6c5c]">
          Explore lots of words at this level — swipe through as many as you like.
        </p>
      </header>

      {/* Level selector */}
      <div className="inline-flex gap-2 rounded-full bg-[#F3E8DD] p-1">
        {LEVEL_OPTIONS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setActiveLevel(level)}
            className={`px-4 py-1 text-xs font-medium rounded-full transition
              ${
                activeLevel === level
                  ? "bg-[#1E3A5F] text-white"
                  : "text-[#3D2817]"
              }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-[#E8DFD4] bg-[#FFFBF5] p-6 shadow-sm">
        <div className="flex items-center justify-between text-xs text-[#7a6c5c]">
          <span>Level: {activeLevel}</span>
          <span>
            Word {words.length ? index + 1 : 0} of{" "}
            {words.length || 0}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {loading && (
            <p className="text-sm text-[#7a6c5c]">Loading words…</p>
          )}

          {!loading && !current && (
            <p className="text-sm text-[#7a6c5c]">
              No words available yet for this level.
            </p>
          )}

          {!loading && current && (
            <div className="space-y-4">
              {/* Word + audio + part of speech */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-[42px] leading-tight font-semibold text-[#3D2817]">
                    {current.word}
                  </h3>
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className="flex items-center justify-center rounded-full border border-[#D4C5B3] bg-[#FDFBF8] p-2 hover:bg-[#F5F1EB]"
                    aria-label={`Play pronunciation for ${current.word}`}
                  >
                    <Volume2 className="h-5 w-5 text-[#1E3A5F]" />
                  </button>
                </div>

                {current.partOfSpeech && (
                  <p className="text-xs font-semibold tracking-[0.25em] text-[#7a6c5c] uppercase">
                    {current.partOfSpeech}
                  </p>
                )}

                {current.definition && (
                  <p className="text-[18px] text-[#4A3A2A]">
                    {current.definition}
                  </p>
                )}

                {current.example && (
                  <p className="text-[16px] italic text-[#7a6c5c]">
                    “{current.example}”
                  </p>
                )}
              </div>

              {/* Synonyms / Antonyms */}
              <div className="flex flex-wrap gap-2 pt-2">
                {current.synonyms && current.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#7a6c5c]">
                      Synonyms:
                    </span>
                    {current.synonyms.slice(0, 5).map((syn: string) => (
                      <span
                        key={syn}
                        className="rounded-full bg-[#F3E8DD] px-3 py-1 text-xs text-[#3D2817]"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                )}

                {current.antonyms && current.antonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#7a6c5c]">
                      Antonyms:
                    </span>
                    {current.antonyms.slice(0, 5).map((ant: string) => (
                      <span
                        key={ant}
                        className="rounded-full bg-[#E8DFD4] px-3 py-1 text-xs text-[#3D2817]"
                      >
                        {ant}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handlePrev}
                  className="
                    rounded-full border border-[#D4C5B3]
                    px-6 py-2 text-sm font-medium
                    text-[#3D2817] bg-[#FDFBF8] hover:bg-[#F5F1EB]
                  "
                >
                  Previous
                </button>

                <button
                  onClick={handleFavorite}
                  className="
                    rounded-full border border-[#D4C5B3]
                    px-4 py-1 text-xs font-medium
                    text-[#3D2817] bg-[#FDFBF8] hover:bg-[#F5F1EB]
                  "
                >
                  {firebaseUser
                    ? "Save word for review"
                    : "Log in to save this word"}
                </button>

                <button
                  onClick={handleNext}
                  className="
                    rounded-full bg-[#1E3A5F]
                    px-6 py-2 text-sm font-medium
                    text-white hover:bg-[#162c46]
                  "
                >
                  Next
                </button>
              </div>

              {saveMessage && (
                <p className="pt-2 text-xs text-[#7a6c5c]">
                  {saveMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
