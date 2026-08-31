// src/authentication.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase_main";

export const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Automatically redirect to /dashboard if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return unsub;
  }, [navigate]);

  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("✅ Sign up successful! Please sign in.");
      setIsRegistering(false);
      // Optional: sign out immediately after registration so user can sign in freshly
      await signOut(auth);
    } catch (err) {
      setMessage("❌ Sign up failed: " + err.message);
    }
  };

  const signin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("✅ Sign in successful!");
      // Redirect handled by onAuthStateChanged
    } catch (err) {
      setMessage("❌ Sign in failed: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>{isRegistering ? "Sign Up" : "Sign In"}</h2>

      <input
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        placeholder="Email..."
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        placeholder="Password..."
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      {isRegistering ? (
        <button onClick={signup}>Sign Up</button>
      ) : (
        <button onClick={signin}>Sign In</button>
      )}

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      <p style={{ marginTop: 16 }}>
        {isRegistering ? "Already have an account?" : "Don’t have an account?"}{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Sign In" : "Sign Up"}
        </span>
      </p>
    </div>
  );
};
