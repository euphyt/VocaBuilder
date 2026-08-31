// src/Dashboard.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "./firebase_main";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Dashboard() {
  const uid = auth.currentUser?.uid || null;
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    async function load() {
      setLoading(true);
      // newest first; Firestore will prompt you to create this index if missing
      const hq = query(
        collection(db, "users", uid, "history"),
        orderBy("createdAt", "desc")
      );
      const fq = collection(db, "users", uid, "favorites");

      const [hSnap, fSnap] = await Promise.all([getDocs(hq), getDocs(fq)]);
      setHistory(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setFavorites(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }

    load();
  }, [uid]);

  if (!uid) return <p>Please sign in.</p>;
  if (loading) return <p>Loading…</p>;

  const removeFavorite = async (wordId) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "favorites", String(wordId)));
    // update UI locally
    setFavorites(prev => prev.filter(f => f.id !== String(wordId)));
  };

  return (
    <div style={{ maxWidth: 640, margin: "24px auto" }}>
      <h2>History</h2>
      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {history.map(h => (
            <li key={h.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <strong>{h.text}</strong>{" "}
              <small style={{ opacity: 0.6 }}>
                {h.createdAt?.toDate?.().toLocaleString?.() || ""}
              </small>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 24 }}>Favorites</h2>
      {favorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul>
          {favorites.map(f => (
            <li key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
              <strong style={{ flex: 1 }}>{f.text}</strong>
              <button
                onClick={() => removeFavorite(f.id)}
                style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
              >
                Remove ★
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 16 }}>
        <Link to="/">← Back to Today’s Word</Link>

      </p>
    </div>
  );
}
