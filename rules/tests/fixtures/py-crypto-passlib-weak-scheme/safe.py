from passlib.context import CryptContext

# ok: auth.py.crypto.passlib-weak-scheme
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ok: auth.py.crypto.passlib-weak-scheme
argon2_context = CryptContext(schemes=["argon2"])

# Modern schemes only; "sha256_crypt" must not match the "hex_sha256" entry.
# ok: auth.py.crypto.passlib-weak-scheme
strong_context = CryptContext(schemes=["argon2", "pbkdf2_sha256", "sha256_crypt"])
