from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

import bcrypt

from app.database import get_db
from app.models import User
from app.auth_utils import create_access_token, verify_access_token


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# REQUEST SCHEMAS
# =========================================================

class RegisterRequest(BaseModel):

    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):

    email: EmailStr
    password: str


class VerifyTokenRequest(BaseModel):

    token: str


# =========================================================
# PASSWORD FUNCTIONS
# =========================================================

def hash_password(password: str) -> str:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:

        raise ValueError(
            "Password must be 72 bytes or fewer."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    password: str,
    password_hash: str
) -> bool:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:

        return False

    return bcrypt.checkpw(
        password_bytes,
        password_hash.encode("utf-8")
    )


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )


    try:

        password_hash = hash_password(
            data.password
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


    user = User(
        name=data.name,
        email=data.email,
        password_hash=password_hash
    )


    db.add(user)

    db.commit()

    db.refresh(user)


    return {

        "success": True,

        "message": "Account created successfully.",

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email
        }
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )


    if not verify_password(
        data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )


    # =====================================================
    # CREATE REAL JWT
    # =====================================================

    access_token = create_access_token(
        user_id=user.id,
        email=user.email
    )


    return {

        "success": True,

        "message": "Login successful.",

        "access_token": access_token,

        "token_type": "bearer",

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email
        }
    }


# =========================================================
# VERIFY TOKEN
# =========================================================

@router.post("/verify")
def verify_token(
    data: VerifyTokenRequest
):

    user_data = verify_access_token(
        data.token
    )


    if not user_data:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )


    return {

        "success": True,

        "authenticated": True,

        "user_id": user_data["user_id"],

        "email": user_data["email"]
    }


# =========================================================
# LOGOUT
# =========================================================

@router.post("/logout")
def logout():

    return {

        "success": True,

        "message": "Logout successful."
    }