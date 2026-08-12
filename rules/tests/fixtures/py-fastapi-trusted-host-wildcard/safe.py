from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# Concrete allow-list of hostnames.
# ok: auth.py.fastapi.trusted-host-wildcard
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["app.example.com", "www.example.com"],
)

# Subdomain wildcard is a valid, scoped allow-list entry (not a bare "*").
# ok: auth.py.fastapi.trusted-host-wildcard
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*.example.com", "example.com"],
)

# Hosts sourced from configuration.
# ok: auth.py.fastapi.trusted-host-wildcard
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
