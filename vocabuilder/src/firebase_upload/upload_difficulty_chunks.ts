import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// =========================================
// CONFIG
const COLLECTION_NAME = "word_list_difficulty_sort";
const JSON_FILES = [
    "beginner.json",
    "intermediate.json",
    "advanced.json"
];
// =========================================

// Load service account key (relative to this script)
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadChunks() {
  for (let i = 0; i < JSON_FILES.length; i++) {
    const filePath = path.join(__dirname, JSON_FILES[i]);
    console.log(`Reading ${filePath}...`);

    const fileContent = fs.readFileSync(filePath, "utf8");
    const jsonObject = JSON.parse(fileContent);

    const docId = `chunk_${i + 1}`;

    await db.collection(COLLECTION_NAME).doc(docId).set(jsonObject);
    console.log(`Uploaded ${docId} (${Object.keys(jsonObject).length} words)`);
  }

  console.log("All chunks uploaded successfully!");
}

uploadChunks().catch(console.error);
