"""
JWT authentication for a FastAPI app.

- POST /login         -> verifies credentials, returns a signed JWT
- GET  /me            -> protected route, requires a valid Bearer token
- GET  /public        -> open route, for contrast

Run:
    pip install fastapi "uvicorn[standard]" pyjwt "passlib[bcrypt]" python-multipart
    uvicorn 05-fastapi-jwt:app --reload

Try it:
    curl -X POST localhost:8000/login -d "username=alice&password=wonderland"
    curl localhost:8000/me -H "Authorization: Bearer <token>"
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt  # PyJWT
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import BaseModel

# --- Config ---------------------------------------------------------------

# In production, load this from a secret manager / env var. Never commit it.
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer tells FastAPI/Swagger where to grab the token from
# (the Authorization: Bearer <token> header) and powers the docs "Authorize" UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="FastAPI JWT Auth")


# --- Fake user store ------------------------------------------------------
# Swap this out for a real database lookup. Passwords are stored hashed.

FAKE_USERS = {
    "alice": {
        "username": "alice",
        "full_name": "Alice Liddell",
        "hashed_password": pwd_context.hash("wonderland"),
        "disabled": False,
    },
    "bob": {
        "username": "bob",
        "full_name": "Bob Builder",
        "hashed_password": pwd_context.hash("hunter2"),
        "disabled": True,  # demo of a disabled account
    },
}


# --- Models ---------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class User(BaseModel):
    username: str
    full_name: Optional[str] = None
    disabled: bool = False


# --- Helpers --------------------------------------------------------------

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_user(username: str) -> Optional[dict]:
    return FAKE_USERS.get(username)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,            # who the token is about
        "exp": expire,             # PyJWT validates this automatically on decode
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# --- Dependency: validate the JWT and resolve the current user ------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exc
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exc

    user = get_user(username)
    if user is None:
        raise credentials_exc
    return User(**{k: user[k] for k in ("username", "full_name", "disabled")})


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


# --- Routes ---------------------------------------------------------------

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Verify username/password (form-encoded) and issue a JWT."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user["username"])
    return Token(access_token=access_token)


@app.get("/me", response_model=User)
async def read_me(current_user: User = Depends(get_current_active_user)):
    """Protected route. Requires a valid, non-expired Bearer token."""
    return current_user


@app.get("/public")
async def public():
    return {"message": "anyone can see this"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
