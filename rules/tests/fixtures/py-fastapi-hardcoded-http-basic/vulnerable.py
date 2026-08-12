import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
security = HTTPBasic()


def check_plain(credentials: HTTPBasicCredentials = Depends(security)):
    # ruleid: auth.py.fastapi.hardcoded-http-basic
    if credentials.username == "admin":
        # ruleid: auth.py.fastapi.hardcoded-http-basic
        if credentials.password == "s3cr3t":
            return credentials.username
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def check_compare_digest(
    credentials: Annotated[HTTPBasicCredentials, Depends(security)],
):
    # ruleid: auth.py.fastapi.hardcoded-http-basic
    is_user = secrets.compare_digest(
        credentials.username.encode("utf8"), b"stanleyjobson"
    )
    # ruleid: auth.py.fastapi.hardcoded-http-basic
    is_pass = secrets.compare_digest(
        credentials.password.encode("utf8"), b"swordfish"
    )
    if not (is_user and is_pass):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return credentials.username


async def check_async(credentials: HTTPBasicCredentials = Depends(security)):
    # ruleid: auth.py.fastapi.hardcoded-http-basic
    if secrets.compare_digest(credentials.password, "hunter2"):
        return credentials.username
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
