# backend/app/main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from typing import Optional

app = FastAPI(title="VocaBuilder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Paths ----------
BACKEND = Path(__file__).resolve().parents[1]
DB_PATH = BACKEND / "data" / "words.db"

# ---------- Difficulty bands (your latest choice) ----------
LEVELS = {
    "Beginner": (2.5, 3.5),
    "Intermediate": (1.8, 2.5),
    "Advanced": (1.1, 1.7),
}

# ---------- Stopwords / common junk to exclude ----------
COMMON = (
    # Articles & prepositions
    "a","an","the","of","in","on","at","by","to","for","from","with","as","about",
    "into","over","under","after","before",
    # Pronouns
    "i","you","he","she","it","we","they","me","him","her","us","them",
    "my","your","his","their","our","mine","yours","hers","ours","theirs",
    # Auxiliaries / modals
    "is","am","are","was","were","be","been","being",
    "do","does","did","doing",
    "have","has","had","having",
    "will","would","shall","should","can","could","may","might","must",
    # Negatives (include straight and curly apostrophes)
    "not","no","nor","dont","don't","doesnt","doesn't","didnt","didn't",
    "wont","won't","wouldnt","wouldn't","cant","can't","couldnt","couldn't",
    "isnt","isn't","wasnt","wasn't","werent","weren't",
    "hasnt","hasn't","havent","haven't","hadnt","hadn't",
    # Conjunctions
    "and","or","but","so","yet","because","though","although","if","while",
    "unless","until","since","when","whenever",
    # Wh-words & fillers/demonstratives
    "what","which","who","whom","whose","where","when","why","how",
    "this","that","these","those","there","here","then","now","just","very","really",
    # Misc short fillers
    "up","out","off","all","any","some","every","such","own","same"
)

# ---------- Keep these irregulars even if they look like inflections ----------
ALLOW_INFLECTIONS = (
    "children","teeth","feet","men","women","people",
    "data","media","criteria","phenomena","alumni",
    "series","species"
)

def get_db():
    return sqlite3.connect(DB_PATH)

@app.get("/health")
def health():
    return {"ok": DB_PATH.exists()}

@app.get("/words")
def list_words(
    level: str = Query(..., description="Beginner | Intermediate | Advanced"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    q: Optional[str] = Query(None),

    # ---- Filter controls (can be adjusted via query params)
    min_len: int = Query(5, ge=1, description="Minimum word length"),
    exclude_common: bool = Query(True, description="Exclude stopwords"),
    only_lower: bool = Query(True, description="Drop capitalized/proper nouns"),
    exclude_inflections: bool = Query(True, description="Drop -ing/-ed and simple plurals"),
):
    # Validate level
    if level not in LEVELS:
        raise HTTPException(status_code=400, detail=f"level must be one of {list(LEVELS)}")

    lo, hi = LEVELS[level]
    off = (page - 1) * size

    con = get_db()
    cur = con.cursor()

    # Base constraints: difficulty band + minimum length
    where = ["zipf BETWEEN ? AND ?", "LENGTH(word) >= ?"]
    params: list = [lo, hi, min_len]

    # Remove proper nouns (capitalized)
    if only_lower:
        where.append("LOWER(word) = word")

    # Optional search
    if q:
        where.append("LOWER(word) LIKE ?")
        params.append(f"%{q.lower()}%")

    # Stopwords
    if exclude_common and COMMON:
        placeholders = ",".join(["?"] * len(COMMON))
        where.append(f"LOWER(word) NOT IN ({placeholders})")
        params.extend(COMMON)

    # De-inflect: hide gerunds, regular past, simple plurals (but keep useful irregulars)
    if exclude_inflections:
        # 1) no -ing gerunds
        where.append("word NOT LIKE '%ing'")
        # 2) no -ed past tense
        where.append("word NOT LIKE '%ed'")
        # 3) heuristics for simple -s plurals (avoid killing words like 'analysis', 'happiness', etc.)
        #    Exclude if it ends with 's' BUT NOT: 'ss','is','us','ous','ness','less'
        #    OR allow it if on the irregular allowlist.
        allow_ph = ",".join(["?"] * len(ALLOW_INFLECTIONS))
        where.append(
            f"(LOWER(word) IN ({allow_ph}) "
            f"OR NOT (word LIKE '%s' "
            f"AND word NOT LIKE '%ss' "
            f"AND word NOT LIKE '%is' "
            f"AND word NOT LIKE '%us' "
            f"AND word NOT LIKE '%ous' "
            f"AND word NOT LIKE '%ness' "
            f"AND word NOT LIKE '%less'))"
        )
        params.extend(ALLOW_INFLECTIONS)

    where_sql = "WHERE " + " AND ".join(where)

    # Count for pagination
    cur.execute(f"SELECT COUNT(*) FROM words {where_sql}", params)
    total = cur.fetchone()[0]

    # Page results
    cur.execute(
        f"""
        SELECT word, zipf
        FROM words
        {where_sql}
        ORDER BY zipf DESC, word ASC
        LIMIT ? OFFSET ?
        """,
        (*params, size, off),
    )
    items = [{"word": w, "zipf": z} for (w, z) in cur.fetchall()]
    con.close()

    return {"level": level, "page": page, "size": size, "total": total, "items": items}
