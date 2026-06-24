import os

import jwt
from django.conf import settings


def sign_from_env(payload: dict):
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")


def sign_from_settings(payload: dict):
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def verify_with_variable(token: str):
    key = os.environ["JWT_SECRET"]
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.decode(token, key, algorithms=["HS256"])
