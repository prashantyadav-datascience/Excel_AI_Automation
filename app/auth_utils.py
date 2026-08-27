from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = "excel-ai-automation-secret-key-change-this"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# CREATE JWT TOKEN
# =========================================================

def create_access_token(user_id: int, email: str):

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =========================================================
# VERIFY JWT TOKEN
# =========================================================

def verify_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")
        email = payload.get("email")

        if user_id is None:
            return None

        return {
            "user_id": int(user_id),
            "email": email
        }

    except JWTError:

        return None