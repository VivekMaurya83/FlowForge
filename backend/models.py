from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

class DiagramCreate(BaseModel):
    title: str
    nodes: List[Any]
    edges: List[Any]

class DiagramUpdate(BaseModel):
    title: Optional[str] = None
    nodes: Optional[List[Any]] = None
    edges: Optional[List[Any]] = None
    current_version: Optional[int] = None

class DiagramResponse(BaseModel):
    id: str
    user_id: str
    title: str
    nodes: List[Any]
    edges: List[Any]
    created_at: str
    updated_at: str
    current_version: int
