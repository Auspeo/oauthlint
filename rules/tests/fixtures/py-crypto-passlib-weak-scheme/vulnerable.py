from passlib.context import CryptContext

# ruleid: auth.py.crypto.passlib-weak-scheme
pwd_context = CryptContext(schemes=["md5_crypt"], deprecated="auto")

# ruleid: auth.py.crypto.passlib-weak-scheme
plain_context = CryptContext(schemes=["plaintext"])

# Weak digest scheme mixed into the list.
# ruleid: auth.py.crypto.passlib-weak-scheme
mixed_context = CryptContext(schemes=["hex_sha1", "des_crypt"])

# ruleid: auth.py.crypto.passlib-weak-scheme
ldap_context = CryptContext(schemes=["ldap_plaintext"], deprecated="auto")
