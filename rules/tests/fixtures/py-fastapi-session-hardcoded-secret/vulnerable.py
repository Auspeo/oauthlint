from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

# ruleid: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(SessionMiddleware, secret_key="super-secret-value-123")

# ruleid: auth.py.fastapi.session-hardcoded-secret
app.add_middleware(
    SessionMiddleware,
    secret_key="another-hardcoded-key",
    session_cookie="sid",
    max_age=3600,
)

# Direct instantiation form.
# ruleid: auth.py.fastapi.session-hardcoded-secret
mw = SessionMiddleware(app, secret_key="inline-literal-secret")
