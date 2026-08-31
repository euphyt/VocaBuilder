import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase_main";

interface SignOutButtonProps {
  // Optional callback if you want to do something after sign out
  onSignOut?: () => void;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({ onSignOut }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (onSignOut) onSignOut(); // call optional callback
      navigate("/login"); // redirect to login
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};
