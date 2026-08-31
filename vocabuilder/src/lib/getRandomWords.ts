// src/lib/getRandomWords.ts
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase_main";

const COLLECTION_NAME = "vocab_words";

// 🔹 Track seen word IDs in localStorage so we don't repeat them
const SEEN_WORDS_KEY = "vb_seen_word_ids";

function getSeenWordIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_WORDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSeenWordIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(ids);
    window.localStorage.setItem(SEEN_WORDS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export type LevelKey = "Beginner" | "Intermediate" | "Advanced";

export interface FirestoreSynset {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
  pos?: string;
}

export interface FirestoreWord {
  word?: string;
  Word?: string;
  SUBTLEX?: {
    ["Zipf-value"]?: number;
    Dom_PoS_SUBTLEX?: string;
    All_PoS_SUBTLEX?: string; // sometimes "Noun.Name", etc.
  };
  synsets?: FirestoreSynset[];
}

// What the rest of the app uses
export interface VocabWord {
  id: string;
  word: string;
  partOfSpeech: string;   // e.g., "Noun", "Verb"
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  level: LevelKey;
}

const LEVEL_RANGES: Record<LevelKey, { min: number; max: number }> = {
  Beginner: { min: 2.5, max: 3.5 },
  Intermediate: { min: 1.8, max: 2.5 },
  Advanced: { min: 1.1, max: 1.7 },
};

// Normalize POS: "Noun.Name" -> "Noun"
function normalizePos(raw?: string): string {
  if (!raw) return "";
  return raw.split(".")[0];
}

function pickPrimarySense(doc: FirestoreWord): FirestoreSynset | null {
  const senses = doc.synsets ?? [];
  if (!senses.length) return null;

  const withDefAndExample = senses.find(
    (s) => s.definition && s.example
  );
  return withDefAndExample ?? senses[0];
}

export async function getRandomWords(
  level: LevelKey,
  count?: number
): Promise<VocabWord[]> {
  const range = LEVEL_RANGES[level];

  if (!range) {
    console.warn("Unknown level:", level);
    return [];
  }

  const colRef = collection(db, COLLECTION_NAME);

  const MAX_FETCH = 500;
  const baseTarget = typeof count === "number" ? count : 50;
  const fetchLimit = Math.min(baseTarget * 10, MAX_FETCH);

  const q = query(
    colRef,
    where("SUBTLEX.Zipf-value", ">=", range.min),
    where("SUBTLEX.Zipf-value", "<=", range.max),
    limit(fetchLimit)
  );

  const snap = await getDocs(q);

  let rawWords: VocabWord[] = snap.docs.map((docSnap) => {
    const data = docSnap.data() as FirestoreWord;
    const primary = pickPrimarySense(data);

    const rawPos =
      data.SUBTLEX?.Dom_PoS_SUBTLEX ??
      data.SUBTLEX?.All_PoS_SUBTLEX ??
      "";

    return {
      id: docSnap.id,
      word: data.word ?? data.Word ?? "(unknown)",
      partOfSpeech: normalizePos(rawPos),
      definition: primary?.definition ?? "",
      example: primary?.example ?? "",
      synonyms: primary?.synonyms ?? [],
      antonyms: primary?.antonyms ?? [],
      level,
    };
  });

  // Only keep words that actually have a definition
  rawWords = rawWords.filter(
    (w) => w.definition && w.definition.trim().length > 0
  );

  // 🔹 Filter out words we've already seen
  const seenIds = getSeenWordIds();
  let filtered = rawWords.filter((w) => !seenIds.has(w.id));

  // If filtering removes everything, fall back to the full list
  if (filtered.length === 0) {
    filtered = rawWords;
  }

  // Fisher–Yates shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  let finalWords: VocabWord[];
  if (typeof count === "number") {
    finalWords = filtered.slice(0, count);
  } else {
    finalWords = filtered;
  }

  // 🔹 Mark these words as seen
  if (finalWords.length > 0) {
    for (const w of finalWords) {
      seenIds.add(w.id);
    }
    saveSeenWordIds(seenIds);
  }

  return finalWords;
}
