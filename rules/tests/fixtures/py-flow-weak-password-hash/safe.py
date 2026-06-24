import hashlib
import hmac

import bcrypt
from argon2 import PasswordHasher
from passlib.hash import argon2 as passlib_argon2


def hash_with_bcrypt(password: str) -> bytes:
    # ok: auth.py.flow.weak-password-hash
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def hash_with_argon2(password: str) -> str:
    ph = PasswordHasher()
    # ok: auth.py.flow.weak-password-hash
    return ph.hash(password)


def hash_with_passlib(password: str) -> str:
    # ok: auth.py.flow.weak-password-hash
    return passlib_argon2.hash(password)


def hash_with_scrypt(password: str, salt: bytes) -> bytes:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)


def checksum_file(file_bytes: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.sha256(file_bytes).hexdigest()


def content_digest(data: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.md5(data).hexdigest()


def sign_message(key: bytes, message: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hmac.new(key, message, hashlib.sha256).hexdigest()
