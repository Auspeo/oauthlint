import os
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import APIKeyHeader

app = FastAPI()
api_key_header = APIKeyHeader(name="X-API-Key")


def get_api_key(api_key: str = Security(api_key_header)):
    # Compared against a secret from the environment.
    # ok: auth.py.fastapi.hardcoded-api-key
    if secrets.compare_digest(api_key, os.environ["API_KEY"]):
        return api_key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def get_api_key_lookup(
    api_key: Annotated[str, Security(api_key_header)],
):
    # Verified against a key store — no literal.
    # ok: auth.py.fastapi.hardcoded-api-key
    if is_valid_api_key(api_key):
        return api_key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def get_role(role: str = Depends(current_role)):
    # Generic Depends value compared to a literal — an authorization check,
    # NOT a credential. Must not fire (why the anchor is Security, not Depends).
    # ok: auth.py.fastapi.hardcoded-api-key
    if role == "admin":
        return role
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
