import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import APIKeyHeader

app = FastAPI()
api_key_header = APIKeyHeader(name="X-API-Key")


def get_api_key(api_key: str = Security(api_key_header)):
    # ruleid: auth.py.fastapi.hardcoded-api-key
    if api_key == "my-super-secret-api-key":
        return api_key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def get_api_key_annotated(
    api_key: Annotated[str, Security(api_key_header)],
):
    # ruleid: auth.py.fastapi.hardcoded-api-key
    if not secrets.compare_digest(api_key, "another-hardcoded-key"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return api_key


async def get_api_key_async(api_key: str = Security(api_key_header)):
    # ruleid: auth.py.fastapi.hardcoded-api-key
    if secrets.compare_digest(api_key.encode("utf8"), b"literal-bytes-key"):
        return api_key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
