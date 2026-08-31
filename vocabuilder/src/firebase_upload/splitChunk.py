import json
import os

input_file = "subtlex_wordnet_filtered.json"
chunk_size = 19000  # words per chunk
output_dir = "chunks"

# Make output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Load the full JSON
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

words = list(data.keys())
total_words = len(words)
total_chunks = (total_words + chunk_size - 1) // chunk_size

print(f"Total words: {total_words}, splitting into {total_chunks} chunks of up to {chunk_size} words each.")

# Split into chunks
for i in range(total_chunks):
    start_idx = i * chunk_size
    end_idx = min(start_idx + chunk_size, total_words)
    chunk_words = words[start_idx:end_idx]
    chunk_data = {w: data[w] for w in chunk_words}
    
    chunk_file = os.path.join(output_dir, f"chunk_{i+1}.json")
    with open(chunk_file, "w", encoding="utf-8") as f:
        json.dump(chunk_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {chunk_file} with {len(chunk_words)} words.")

print("✅ All chunks created successfully.")
