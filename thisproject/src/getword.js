// src/getword.js
import React, { useEffect, useState } from "react";
import wordsData from "./wordList/words_list.json";
import { auth, db } from "./firebase_main";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function GrabWord({ id }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const wordObj = wordsData.find((item) => item.id === id);
  const uid = auth.currentUser?.uid;

  // --- Save today's word to history when loaded ---
  useEffect(() => {
    if (!uid || !wordObj) return;

    const saveHistory = async () => {
      try {
        const historyRef = doc(db, "users", uid, "history", String(wordObj.id));
        const historySnap = await getDoc(historyRef);

        // Save to history only once
        if (!historySnap.exists()) {
          await setDoc(historyRef, {
            text: wordObj.word,
            definition: wordObj.definition,
            createdAt: serverTimestamp(),
            source: "daily",
          });
        }

        // Check if the word is already favorited
        const favRef = doc(db, "users", uid, "favorites", String(wordObj.id));
        const favSnap = await getDoc(favRef);
        setIsFavorite(favSnap.exists());
      } catch (error) {
        console.error("Error saving history or checking favorites:", error);
      }
    };

    saveHistory();
  }, [uid, wordObj]);

  // --- Toggle favorite/unfavorite ---
  const toggleFavorite = async () => {
    if (!uid || !wordObj) return;

    try {
      const favRef = doc(db, "users", uid, "favorites", String(wordObj.id));

      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, {
          text: wordObj.word,
          definition: wordObj.definition,
          createdAt: serverTimestamp(),
          source: "daily",
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (!wordObj) return <p>No word found.</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h1>{wordObj.word}</h1>
      <p>{wordObj.definition}</p>

      {uid && (
        <button
          onClick={toggleFavorite}
          style={{
            marginTop: "20px",
            fontSize: "16px",
            padding: "6px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            border: "1px solid #aaa",
            background: "white",
          }}
        >
          {isFavorite ? "★ Favorited" : "☆ Favorite"}
        </button>
      )}
    </div>
  );
}