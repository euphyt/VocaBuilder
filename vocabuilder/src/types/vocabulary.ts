export type Level = "beginner" | "intermediate" | "advanced";

export interface Synset {
  definition: string;
  example?: string;
  pos?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface VocabularyWord {
  id: string;
  word: string;
  zipfValue?: number;
  level?: Level;
  synsets: Synset[];
}
