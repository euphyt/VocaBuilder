# backend/app/seed_subtlex.py
import csv
import sqlite3
from pathlib import Path

# ---------- Paths (this file is inside backend/app) ----------
BACKEND = Path(__file__).resolve().parents[1]      # -> .../s2-t9/backend
CSV_PATH = BACKEND / "data" / "subtlex.csv"
DB_PATH  = BACKEND / "data" / "words.db"

assert CSV_PATH.exists(), f"CSV not found at {CSV_PATH}"

# ---------- Create DB / table ----------
con = sqlite3.connect(DB_PATH)
cur = con.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT UNIQUE,
  zipf REAL,          -- we'll store Lg10WF here (Zipf-like)
  pos TEXT,           -- not present in this CSV; kept for future use
  freqcount INTEGER
)
""")
cur.execute("CREATE INDEX IF NOT EXISTS idx_words_zipf ON words(zipf)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_words_word ON words(word)")

# ---------- Insert rows ----------
inserted = 0
skipped  = 0

# Try encodings robustly
for enc in ("utf-8-sig", "utf-8", "latin-1"):
    try:
        f = open(CSV_PATH, "r", encoding=enc, newline="")
        break
    except UnicodeDecodeError:
        f = None
if f is None:
    raise RuntimeError("Could not open CSV with utf-8 or latin-1")

with f:
    reader = csv.DictReader(f)

    for row in reader:
        # Column names from your screenshot
        # Word,FREQcount,CDcount,FREQlow,Cdlow,SUBTLWF,Lg10WF,SUBTLCD
        word = (row.get("Word") or row.get("word") or "").strip()
        # Prefer Lg10WF (log10 word freq); fall back to SUBTLWF if missing
        zipf_like = row.get("Lg10WF") or row.get("SUBTLWF") or ""
        freq = row.get("FREQcount") or row.get("FREQ") or row.get("freq")
        pos  = None  # not provided by this CSV

        if not word or not zipf_like:
            skipped += 1
            continue

        try:
            cur.execute(
                "INSERT OR IGNORE INTO words (word, zipf, pos, freqcount) VALUES (?,?,?,?)",
                (word, float(zipf_like), pos, int(freq) if freq and freq.strip() else None)
            )
            if cur.rowcount:
                inserted += 1
        except Exception as e:
            print(f"Skipping row ({word}) due to error: {e}")
            skipped += 1

con.commit()
con.close()

print(f"✅ Done. Inserted: {inserted:,}  | Skipped: {skipped:,}")
print(f"DB path: {DB_PATH}")
