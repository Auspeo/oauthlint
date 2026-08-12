import os
import secrets

from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

# Loaded from the environment.
# ok: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key=os.environ["SESSION_SECRET"])

# Settings reference.
# ok: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

# Generated with a CSPRNG.
# ok: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key=secrets.token_hex(32))

# Obvious placeholder / env template — not a real secret.
# ok: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key="${SESSION_SECRET}")

# ok: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key="changeme")
