from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .db import get_db
from .models import Word
from .schemas import WordsPage

router = APIRouter(prefix="/words", tags=["words"])

@router.get("", response_model=WordsPage)
def list_words(
    level: str = Query(..., pattern="^(Beginner|Intermediate|Advanced)$"),
    query: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    if limit > 100:
        limit = 100
    q = db.query(Word).filter(Word.level == level)
    if query:
        like = f"%{query.lower()}%"
        q = q.filter(Word.text.ilike(like))

    total = q.count()
    items = (q.order_by(Word.zipf.desc(), Word.text.asc())
               .offset((page-1)*limit)
               .limit(limit)
               .all())
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "hasMore": (page*limit) < total
    }
