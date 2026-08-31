import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const raw = fs.readFileSync("./groupedWords.json", "utf-8");
const wordData = JSON.parse(raw);

const firebaseConfig = {
  // your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type Level = "beginner" | "intermediate" | "advanced";

function getDifficulty(zipf: number): Level {
  if (zipf > 2.5 && zipf <= 3.5) return "beginner";
  if (zipf > 1.8 && zipf <= 2.5) return "intermediate";
  if (zipf >= 1.1 && zipf <= 1.7) return "advanced";
  return "intermediate"; // fallback
}

async function uploadWords() {
  for (const word of wordData) {
    const zipf = parseFloat(word["Zipf-value"]);
    const difficulty = getDifficulty(zipf);

    const allPos = word.All_PoS_SUBTLEX?.split(".") ?? [];
    const allFreqs = word.All_freqs_SUBTLEX?.split(".").map(Number) ?? [];

    const synsets = Object.values(word.synsets ?? {}).map((sense: any) => ({
      definition: sense.definition ?? "",
      pos: sense.pos ?? "",
      example: sense.example ?? "",
      synonyms: Object.values(sense.synonyms ?? {}),
      antonyms: Object.values(sense.antonyms ?? {})
    }));

    await setDoc(doc(collection(db, "SUBTLEX"), word.Word), {
      word: word.Word,
      zipf,
      difficulty,
      partOfSpeech: word.pos ?? "",
      definition: word.definition ?? "",
      sentence: word.example ?? "",
      synonyms: word.synonyms ?? [],
      antonyms: word.antonyms ?? [],
      subtlx: {
        Dom_PoS: word.Dom_PoS_SUBTLEX,
        All_PoS: allPos,
        All_freqs: allFreqs,
        FREQcount: Number(word.FREQcount),
        FREQlow: Number(word.FREQlow),
        Freq_dom_PoS_SUBTLEX: Number(word.Freq_dom_PoS_SUBTLEX),
        Percentage_dom_PoS: Number(word.Percentage_dom_PoS),
        SUBTLCD: Number(word.SUBTLCD),
        SUBTLWF: Number(word.SUBTLWF),
        Lg10CD: Number(word.Lg10CD),
        Lg10WF: Number(word.Lg10WF)
      },
      synsets
    });
  }

  console.log("✅ All words uploaded to Firestore with full metadata");
}

uploadWords();
