import random
import os
import nltk
from nltk.corpus import wordnet
import json

# download the stuff to get the dictionary of words
nltk.download('wordnet')

# Set number of words to put in the XML file
#50 years
number_of_word_objects = 20000

# Creates a list of words based on wordnet
def every_word_in_a_list():
    words = set()
    for syn in wordnet.all_synsets():
        for lemma in syn.lemmas():
            word = lemma.name().replace('_', ' ')
            if all(w.isalpha() for w in word.split()):
                words.add(word)
    return list(words)

# Gets definition of a word based on wordnet
def get_definition(word):
    lookup_word = word.replace(' ', '_')
    synsets = wordnet.synsets(lookup_word)
    if synsets:
        return synsets[0].definition()
    for syn in wordnet.all_synsets():
        for lemma in syn.lemmas():
            if lemma.name() == lookup_word:
                return syn.definition()
    return None

# creates a random list of words based on the list of words created from wordnet
all_words = every_word_in_a_list()
random.shuffle(all_words)
selected_words = all_words[:number_of_word_objects]

# Build JSON structure
words_list = []
for index_word, word in enumerate(selected_words, start=1):
    definition = get_definition(word)
    if definition != None: 
        words_list.append({
            "id": index_word,
            "word": word,
            "definition": get_definition(word)
        })

# Save to JSON file
output_path = os.path.join(os.path.dirname(__file__), "words_list.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(words_list, f, indent=2)  

print(f"JSON file created at: {output_path}")