from pydantic import BaseModel
from typing import Optional, List

class WordOut(BaseModel):
    id: int
    text: str
    pos: Optional[str] = None
    definition: Optional[str] = None
    example: Optional[str] = None
    level: str
    zipf: Optional[float] = None
    frequency: Optional[int] = None

    class Config:
        from_attributes = True

class WordsPage(BaseModel):
    items: List[WordOut]
    total: int
    page: int
    limit: int
    hasMore: bool
