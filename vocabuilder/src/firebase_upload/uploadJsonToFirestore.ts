// uploadJsonToFirestore.ts
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccount = require("./serviceAccountKey.json");

// ========== CONFIG ==========
const serviceAccountPath = "./serviceAccountKey.json";
const jsonChunkDir = "./chunks"; // folder containing chunk_1.json, chunk_2.json, etc.
const collectionName = "vocab_words";

// Select which chunk to upload manually (1 = chunk_1.json)
const CHUNK_TO_UPLOAD = 2; // chunk 2 done

// TEST MODE: upload only the first TEST_COUNT words 
const UPLOAD_ONLY_FIRST = false; // <-- Set to TRUE to run a short test
const TEST_COUNT = 3;            // <-- Number of words to upload in test mode


// ============================

// Initialize Firebase Admin
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account JSON not found at ${serviceAccountPath}`);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Helper: sanitize word to a safe doc id
function sanitizeDocId(s: any): string {
  if (s === undefined || s === null) return "__empty__";
  const str = String(s).trim().toLowerCase();
  return str.replace(/[\/\s#\[\]\{\}]/g, "_").replace(/[^\x20-\x7E]/g, "");
}

// Main upload function
async function uploadJsonChunk() {
  const chunkFiles = fs.readdirSync(jsonChunkDir)
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  if (CHUNK_TO_UPLOAD < 1 || CHUNK_TO_UPLOAD > chunkFiles.length) {
    console.error(`❌ Invalid CHUNK_TO_UPLOAD: ${CHUNK_TO_UPLOAD}`);
    process.exit(1);
  }

  const chunkFile = path.join(jsonChunkDir, chunkFiles[CHUNK_TO_UPLOAD - 1]);
  console.log(`📖 Loading chunk ${CHUNK_TO_UPLOAD}: ${chunkFile}`);
  const rawData = fs.readFileSync(chunkFile, "utf8");
  const data: Record<string, any> = JSON.parse(rawData);

  const words = Object.keys(data);
  let startIndex = 0;

  const endIndex = UPLOAD_ONLY_FIRST ? Math.min(startIndex + TEST_COUNT, words.length) : words.length;

  console.log(`Uploading words ${startIndex + 1} to ${endIndex} of chunk ${CHUNK_TO_UPLOAD}...`);

  let uploaded = 0;
  let skipped = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const word = words[i];
    const wordData = data[word];

    if (!word) {
      console.warn(`⚠️ Skipping empty word at index ${i}`);
      continue;
    }

    const docId = sanitizeDocId(word);
    const docRef = db.collection(collectionName).doc(docId);

    try {
      const doc = await docRef.get();
      if (doc.exists) {
        skipped++;
      } else {
        await docRef.set(wordData);
        uploaded++;
      }

      const processed = uploaded + skipped;
      const percent = ((processed / (endIndex - startIndex)) * 100).toFixed(1);
      process.stdout.write(`\rProcessed ${processed}/${endIndex - startIndex} words — ${percent}% (Uploaded: ${uploaded}, Skipped: ${skipped})`);
    } catch (err) {
      console.error(`\n❌ Error processing word '${word}' at index ${i}:`, err);
      console.log("⏸️ Stopping to avoid repeated errors.");
      return;
    }
  }

  console.log(`\n✅ Finished chunk ${CHUNK_TO_UPLOAD}. Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

uploadJsonChunk().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
