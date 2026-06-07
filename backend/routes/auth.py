from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from models import UserCreate, UserResponse, Token
from services.auth_service import get_password_hash, verify_password, create_access_token, get_current_user
from services.mongodb_service import create_user, get_user_by_email

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate):
    # Check if user exists
    existing_user = await get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    hashed_password = get_password_hash(user_in.password)
    new_user = await create_user(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password
    )
    return UserResponse(
        id=new_user["_id"],
        name=new_user["name"],
        email=new_user["email"],
        created_at=new_user["created_at"]
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username) # OAuth2 form uses 'username' for email
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )
