import hashlib


def hash_md5(password: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.md5(password.encode()).hexdigest()


def hash_sha1(passwd: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha1(passwd.encode("utf-8")).hexdigest()


def hash_sha256(user_password: bytes) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha256(user_password).hexdigest()


def hash_sha512(pwd: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha512(pwd.encode()).hexdigest()


def hash_update_form(password: str) -> str:
    h = hashlib.sha256()
    # ruleid: auth.py.flow.weak-password-hash
    h.update(password.encode())
    return h.hexdigest()
