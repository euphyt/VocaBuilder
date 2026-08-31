// @ts-nocheck
import { useState } from "react";
import type { VocabularyWord } from "../types/vocabulary";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";

interface WordCardProps {
  word: VocabularyWord;
}

export function WordCard({ word }: WordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{word.word}</CardTitle>
            <p className="text-sm text-muted-foreground">{word.partOfSpeech}</p>
          </div>
          <Badge
            variant={
              word.difficulty === "beginner"
                ? "secondary"
                : word.difficulty === "intermediate"
                ? "default"
                : "destructive"
            }
          >
            {word.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-sm"
        >
          <span>
            {isExpanded ? "Hide details" : "Show definition and details"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {isExpanded && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Definition</p>
              <p>{word.definition || "No definition available."}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Example</p>
              <p className="italic">
                {word.sentence ? `"${word.sentence}"` : "No example provided."}
              </p>
            </div>

            {(word.synonyms?.length ?? 0) > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">Synonyms</p>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((syn, i) => (
                    <Badge key={i} variant="outline">
                      {syn}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(word.antonyms?.length ?? 0) > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">Antonyms</p>
                <div className="flex flex-wrap gap-2">
                  {word.antonyms.map((ant, i) => (
                    <Badge key={i} variant="outline">
                      {ant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
