from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# ruleid: auth.py.fastapi.trusted-host-wildcard
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Wildcard buried in an otherwise concrete list.
# ruleid: auth.py.fastapi.trusted-host-wildcard
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["app.example.com", "*"],
)

# Direct instantiation form.
# ruleid: auth.py.fastapi.trusted-host-wildcard
mw = TrustedHostMiddleware(app, allowed_hosts=["*"])
