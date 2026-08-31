// src/components/Signup.tsx

import { useState } from "react";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";
import { signUpWithEmailVerification } from "../firebase_main";

interface SignupProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signUpWithEmailVerification(email, password);

    setIsLoading(false);

    if (result.success) {
      onSignup(); // go to login
    } else {
      setError(result.message);
    }
  }

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-[#F5F1EB] via-[#E8DFD4] to-[#D4C5B3]
        px-4
      "
    >
      <div
        className="
          w-full max-w-md bg-[#FFFFFF]
          rounded-[28px]
          shadow-[0_20px_60px_rgba(0,0,0,0.18)]
          border border-[#E8DFD4]
          px-10 py-12
          space-y-8
        "
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-[#88C9A1] flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-[#1E3A5F]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-[#3D2817]">
            Create Account
          </h1>
          <p className="text-[#7A6C5C]">
            Start your journey to a stronger vocabulary
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#3D2817]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="
                w-full text-sm bg-transparent
                border border-[#E8DFD4]
                rounded-[16px]
                px-4 py-3
                focus:outline-none focus:ring-2 focus:ring-[#88C9A1]
              "
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#3D2817]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="
                w-full text-sm bg-transparent
                border border-[#E8DFD4]
                rounded-[16px]
                px-4 py-3
                focus:outline-none focus:ring-2 focus:ring-[#88C9A1]
              "
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="
              w-full rounded-full
              bg-[#1E3A5F] hover:bg-[#162c46]
              py-3 text-[15px] font-medium
            "
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>

          {error && (
            <p className="text-red-600 text-sm pt-2 text-center">{error}</p>
          )}
        </form>

        <p className="text-center text-sm text-[#7A6C5C]">
          Already have an account?{" "}
          <button
            className="text-[#1E3A5F] font-medium underline underline-offset-4"
            onClick={onSwitchToLogin}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
