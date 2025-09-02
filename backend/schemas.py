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
    user_type: str | None
    num_guests: int | None
    reserve_count: int | None
    is_coming: str | None
    area: str | None
    vegan: int
    kids: int
    meat: int
    glutenfree: int
    Bus: str | None
    Bus_Yes : int | None



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