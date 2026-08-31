// src/authentication.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import type { User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "./firebase_main";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Redirect to / if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      if (user && user.emailVerified) {
        navigate("/");
      }
    });
    return unsub;
  }, [navigate]);

  // Sign up with email verification
  const signup = async () => {
    try {
      // 1️⃣ Create user (automatically signed in by Firebase)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user) return;

      await signOut(auth);
      setIsRegistering(false);

      await sendEmailVerification(user);

      // 5️⃣ Display message
      setMessage(
        "✅ Sign up successful! Please check your email to verify your account before signing in."
      );

    } catch (err) {
      const error = err as FirebaseError;
      setMessage("❌ Sign up failed: " + error.message);
    }
  };

  // Sign in with verification check
  const signin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setMessage("❌ Please verify your email before signing in.");
        return;
      }

      setMessage("✅ Sign in successful!");
      // onAuthStateChanged will handle redirect
    } catch (err) {
      const error = err as FirebaseError;
      setMessage("❌ Sign in failed: " + error.message);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
      <h2>{isRegistering ? "Sign Up" : "Sign In"}</h2>

      <input
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        placeholder="Email..."
        value={email}
        onChange={handleEmailChange}
      />
      <input
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        placeholder="Password..."
        type="password"
        value={password}
        onChange={handlePasswordChange}
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
          <p style={{ marginTop: 10, color: "#ccc", fontSize: "0.9em" }}>
      ⚠️ Note: Accounts must be verified via the email link sent after sign-up. You will not be able to log in until your email is verified.
    </p>
    </div>
  );
};
