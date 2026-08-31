// src/components/Activities.tsx
import { useState } from "react";
import Quiz from "./Quiz";
import Flashcards from "./Flashcards";
import Game from "./Game";
import { Button } from "./ui/button";

type ActivityTab = "quiz" | "flashcards" | "match";

export default function Activities() {
  const [tab, setTab] = useState<ActivityTab>("quiz");

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-medium">Activities</h2>
        <p className="text-muted-foreground text-sm">
          Choose a practice mode. Each activity opens its own focused page.
        </p>
      </header>

      {/* Internal toggle: Quiz / Flashcards / Match */}
      <div className="inline-flex gap-2 rounded-full bg-[#F3E8DD] p-1">
        <Button
          type="button"
          variant={tab === "quiz" ? "default" : "ghost"}
          size="sm"
          className={
            tab === "quiz"
              ? "bg-[#1E3A5F] text-white hover:bg-[#162c46]"
              : "text-[#3D2817]"
          }
          onClick={() => setTab("quiz")}
        >
          Quiz
        </Button>

        <Button
          type="button"
          variant={tab === "flashcards" ? "default" : "ghost"}
          size="sm"
          className={
            tab === "flashcards"
              ? "bg-[#1E3A5F] text-white hover:bg-[#162c46]"
              : "text-[#3D2817]"
          }
          onClick={() => setTab("flashcards")}
        >
          Flashcards
        </Button>

        <Button
          type="button"
          variant={tab === "match" ? "default" : "ghost"}
          size="sm"
          className={
            tab === "match"
              ? "bg-[#1E3A5F] text-white hover:bg-[#162c46]"
              : "text-[#3D2817]"
          }
          onClick={() => setTab("match")}
        >
          Match
        </Button>
      </div>

      {/* Only ONE activity visible at a time */}
      {tab === "quiz" && (
        <div className="space-y-4">
          <Quiz />
        </div>
      )}

      {tab === "flashcards" && (
        <div className="space-y-4">
          <Flashcards />
        </div>
      )}

      {tab === "match" && (
        <div className="space-y-4">
          <Game />
        </div>
      )}
    </section>
  );
}
