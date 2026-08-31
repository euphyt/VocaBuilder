import pandas as pd
from nltk.corpus import wordnet
import nltk
import os

# Download WordNet if needed
nltk.download('wordnet')
nltk.download('omw-1.4')

# === Step 0: Use script folder for file paths ===
script_dir = os.path.dirname(os.path.abspath(__file__))
xlsx_file = os.path.join(script_dir, "SUBTLEX.xlsx")
output_file = os.path.join(script_dir, "SUBTLEX_wordnet_checked.xlsx")

# Read Excel file
df = pd.read_excel(xlsx_file)

# List to store words without definitions
removed_words = []

def has_definition(word):
    if pd.isna(word):  # handle empty cells
        removed_words.append(word)
        return False
    word_str = str(word)
    synsets = wordnet.synsets(word_str)
    for syn in synsets:
        if syn.definition().strip():
            return True
    removed_words.append(word_str)  # no valid definition found
    return False

# Apply function to the first column (assumes words are in the first column)
df['In_WordNet_With_Definition'] = df.iloc[:, 0].apply(has_definition)

# Filter out words without definitions
df_filtered = df[df['In_WordNet_With_Definition']]

# Sort by Zipf-value column (lowest to highest)
df_filtered = df_filtered.sort_values(by='Zipf-value', ascending=True)

# Save the filtered and sorted DataFrame
df_filtered.to_excel(output_file, index=False)

# Print removed words
print(f"Words removed ({len(removed_words)}):")
for w in removed_words:
    print(w)
