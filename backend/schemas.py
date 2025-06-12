# backend/schemas.py
from pydantic import BaseModel
from typing import Optional


class SeatOut(BaseModel):
    id: int
    row: int
    col: int
    area: Optional[str]
    status: str
    owner_id: Optional[int]

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str
    phone: str


class UserCreate(UserBase):
    user_type: str = "אורח לא רשום"


class UserOut(UserBase):
    id: int
    user_type: str
    num_guests: int
    reserve_count: int
    is_coming: Optional[str]
    area: Optional[str]

    class Config:
        from_attributes = True


class ComingIn(BaseModel):
    coming: bool


class BlessingIn(BaseModel):
    name: str
    blessing: str


class SingleIn(BaseModel):
    name: str
    gender: str  # "זכר" / "נקבה"
    about: str


class FeedbackIn(BaseModel):
    name: str
    feedback: str