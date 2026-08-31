import React, { useState } from "react";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../../firebase"; // adjust if your firebase.ts path is different

const LEVELS = {
  Beginner: { min: 2.5, max: 3.5 },
  Intermediate: { min: 1.8, max: 2.5 },
  Advanced: { min: 1.1, max: 1.7 },
};

type Level = "beginner" | "intermediate" | "advanced";

function zipfToLevel(zipf: number | undefined): Level {
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

  return "advanced"; // words outside range → treat as advanced
}

const TagWordsAdmin: React.FC = () => {
  const [status, setStatus] = useState<string>("Idle");
  const [progress, setProgress] = useState<string>("");

  const handleTagWords = async () => {
    try {
      setStatus("Fetching docs from vocab_words...");
      const coll = collection(db, "vocab_words");
      const snap = await getDocs(coll);

      setStatus(`Found ${snap.size} documents. Tagging...`);

      let batch = writeBatch(db);
      let counter = 0;

      for (const docSnap of snap.docs) {
        const data = docSnap.data() as any;

        const rawZipf = data["Zipf-value"] ?? data["Zipf_value"];
        const zipf =
          typeof rawZipf === "number"
            ? rawZipf
            : rawZipf !== undefined
            ? Number(rawZipf)
            : undefined;

        const level = zipfToLevel(zipf);
        const rand = Math.random();

        batch.update(docSnap.ref, {
          level,
          rand,
        });

        counter++;

        if (counter % 400 === 0) {
          setProgress((prev) => `${prev}\nCommitted batch at doc #${counter}`);
          await batch.commit();
          batch = writeBatch(db);
        }
      }

      if (counter % 400 !== 0) {
        setProgress((prev) => `${prev}\nCommitted final batch at doc #${counter}`);
        await batch.commit();
      }

      setStatus("✅ DONE! All vocab_words now have level + rand.");
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message ?? String(err)}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Tag vocab_words with level + rand
      </h1>
      <p style={{ marginBottom: "1rem" }}>
        This is a temporary admin page to update all Firestore docs in the
        <code> vocab_words </code> collection.
      </p>
      <button
        onClick={handleTagWords}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "0.5rem",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          background: "#2563eb",
          color: "white",
        }}
      >
        Run Tagging Script
      </button>

      <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        <strong>Status:</strong> {status}
      </p>
      {progress && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f3f4f6",
            borderRadius: "0.5rem",
            maxHeight: "300px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
          {progress}
        </pre>
      )}
    </div>
  );
};

export default TagWordsAdmin;
