import pandas as pd
from nltk.corpus import wordnet as wn
import nltk
import json

nltk.download('wordnet')
nltk.download('omw-1.4')

# === Step 1: Load your SUBTLEX file ===
input_file = "SUBTLEX.xlsx"
output_json = "subtlex_wordnet_filtered.json"

df = pd.read_excel(input_file)
word_column = df.columns[0]  # assuming the first column is the word

firebase_data = {}

# === Step 2: Process each word ===
for idx, row in df.iterrows():
    word = str(row[word_column]).strip()
    if not word:
        continue

    synsets = wn.synsets(word)

    # Skip if no WordNet entries
    if not synsets:
        continue

    # Collect SUBTLEX info for this word
    subtlex_info = {
        col: (row[col] if pd.notna(row[col]) else None)
        for col in df.columns
    }

    # Collect WordNet synset data
    synset_entries = []
    for syn in synsets:
        definition = syn.definition()
        pos = syn.pos()

        synonyms = sorted({lemma.name().replace('_', ' ') for lemma in syn.lemmas()})
        antonyms = sorted({
            ant.name().replace('_', ' ')
            for lemma in syn.lemmas()
            for ant in lemma.antonyms()
        })
        examples = syn.examples()
        example_sentence = examples[0] if examples else ""

        synset_entries.append({
            "definition": definition,
            "synonyms": synonyms,
            "antonyms": antonyms,
            "example": example_sentence,
            "pos": pos
        })

    # Combine all data for this word
    firebase_data[word] = {
        "word": word,
        "SUBTLEX": subtlex_info,
        "synsets": synset_entries
    }

# === Step 3: Save as JSON ===
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(firebase_data, f, ensure_ascii=False, indent=2)

print(f"✅ Done! Filtered data saved to {output_json}")
