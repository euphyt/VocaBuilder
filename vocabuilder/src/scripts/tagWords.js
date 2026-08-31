import { collection, getDocs, writeBatch } from "firebase/firestore";
// important: ESM-style import, but the loader will resolve the TS file.
import { db } from "./firebaseNode.js"; // .js extension is correct here

const LEVELS = {
  Beginner:     { min: 2.5, max: 3.5 },
  Intermediate: { min: 1.8, max: 2.5 },
  Advanced:     { min: 1.1, max: 1.7 },
};

// convert Zipf → Level using YOUR ranges
function zipfToLevel(zipf) {
  if (zipf === undefined || Number.isNaN(zipf)) {
    return "beginner"; // safe fallback
  }

  if (zipf >= LEVELS.Beginner.min && zipf <= LEVELS.Beginner.max) {
    return "beginner";
  }

  if (zipf >= LEVELS.Intermediate.min && zipf < LEVELS.Intermediate.max) {
    return "intermediate";
  }

  if (zipf >= LEVELS.Advanced.min && zipf < LEVELS.Advanced.max) {
    return "advanced";
  }

  // If it doesn't fit any range, treat as advanced (rare word)
  return "advanced";
}

async function run() {
  console.log("🔎 Fetching all docs from vocab_words...");
  const coll = collection(db, "vocab_words");
  const snap = await getDocs(coll);

  console.log(`📄 Found ${snap.size} documents.`);
  console.log("⏳ Updating level + rand for each word...\n");

  let batch = writeBatch(db);
  let counter = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    // Zipf-value may be stored as "Zipf-value" or "Zipf_value"
    const rawZipf = data["Zipf-value"] ?? data["Zipf_value"];
    const zipf =
      typeof rawZipf === "number"
        ? rawZipf
        : rawZipf !== undefined
        ? Number(rawZipf)
        : undefined;

    const level = zipfToLevel(zipf);
    const rand = Math.random();

    // ONLY add these two fields
    batch.update(docSnap.ref, {
      level,
      rand,
    });

    counter++;

    // Firestore batch limit is 500, stay under it
    if (counter % 400 === 0) {
      console.log(`🚀 Committing batch at document #${counter}...`);
      await batch.commit();
      batch = writeBatch(db);
    }
  }

  if (counter % 400 !== 0) {
    console.log("📌 Committing final batch...");
    await batch.commit();
  }

  console.log("\n✅ DONE! All vocab_words now have:");
  console.log("   • level (beginner/intermediate/advanced)");
  console.log("   • rand (random 0–1)\n");
}

run()
  .then(() => {
    console.log("🎉 Script finished successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  });
