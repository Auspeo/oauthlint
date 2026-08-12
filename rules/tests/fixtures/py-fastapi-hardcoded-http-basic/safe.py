import os
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
security = HTTPBasic()


def check_env(credentials: HTTPBasicCredentials = Depends(security)):
    # Compared against secrets from the environment — not hard-coded.
    # ok: auth.py.fastapi.hardcoded-http-basic
    is_user = secrets.compare_digest(
        credentials.username.encode("utf8"),
        os.environ["ADMIN_USER"].encode("utf8"),
    )
    # ok: auth.py.fastapi.hardcoded-http-basic
    is_pass = secrets.compare_digest(
        credentials.password.encode("utf8"),
        os.environ["ADMIN_PASSWORD"].encode("utf8"),
    )
    if not (is_user and is_pass):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return credentials.username


def check_userstore(
    credentials: Annotated[HTTPBasicCredentials, Depends(security)],
):
    user = lookup_user(credentials.username)
    # ok: auth.py.fastapi.hardcoded-http-basic
    if user and verify_password(credentials.password, user.password_hash):
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def unrelated_login(username: str, password: str):
    # Not a FastAPI HTTPBasicCredentials dependency — must not fire.
    # ok: auth.py.fastapi.hardcoded-http-basic
    if password == "letmein":
        return True
    return False
