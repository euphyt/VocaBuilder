// src/lib/getRandomWords.ts
import { collection, getDocs, limit, query, where, } from "firebase/firestore";
import { db } from "../firebase_main";
const COLLECTION_NAME = "vocab_words";
// 🔹 Level ranges based on Zipf-value
const LEVEL_RANGES = {
    Beginner: { min: 2.5, max: 3.5 },
    Intermediate: { min: 1.8, max: 2.5 },
    Advanced: { min: 1.1, max: 1.7 },
};
/**
 * Pick the “best” synset:
 * 1. Prefer one that has both definition + example
 * 2. Otherwise, just use the first synset
 */
function pickPrimarySense(doc) {
    const senses = doc.synsets ?? [];
    if (!senses.length)
        return null;
    const withDefAndExample = senses.find((s) => s.definition && s.example);
    return withDefAndExample ?? senses[0];
}
/**
 * Get `count` random words for a level.
 *
 * Firestore:
 *   - Filters by SUBTLEX.Zipf-value range
 *   - Limits to at most 30 docs
 * Client:
 *   - Shuffles those docs and keeps `count` of them
 */
export async function getRandomWords(level, count = 6) {
    const range = LEVEL_RANGES[level];
    if (!range) {
        console.warn("Unknown level:", level);
        return [];
    }
    // 1) Query FIRESTORE using Zipf range
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("SUBTLEX.Zipf-value", ">=", range.min), where("SUBTLEX.Zipf-value", "<=", range.max), limit(30));
    const snap = await getDocs(q);
    // 2) Map Firestore docs -> VocabWord objects
    const rawWords = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const primary = pickPrimarySense(data);
        return {
            id: docSnap.id,
            word: data.word ?? data.Word ?? "(unknown)",
            partOfSpeech: data.SUBTLEX?.Dom_PoS_SUBTLEX ?? "",
            definition: primary?.definition ?? "",
            example: primary?.example ?? "",
            synonyms: primary?.synonyms ?? [],
            antonyms: primary?.antonyms ?? [],
            level,
        };
    });
    // 3) Shuffle client-side (Fisher–Yates)
    for (let i = rawWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawWords[i], rawWords[j]] = [rawWords[j], rawWords[i]];
    }
    // 4) Return only the first `count` words
    return rawWords.slice(0, count);
}
