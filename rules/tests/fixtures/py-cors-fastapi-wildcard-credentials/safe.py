from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Explicit allow-list with credentials is the correct pattern.
# ok: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wildcard origin is fine when credentials are disabled.
# ok: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
)

# Wildcard without any credentials argument (defaults to False).
# ok: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)
