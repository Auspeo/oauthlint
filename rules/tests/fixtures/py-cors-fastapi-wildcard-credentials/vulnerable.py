from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ruleid: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Argument order reversed: credentials before origins.
# ruleid: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
)

# Wildcard expressed as a regex.
# ruleid: auth.py.cors.fastapi-wildcard-credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
)

# Direct instantiation form.
# ruleid: auth.py.cors.fastapi-wildcard-credentials
middleware = CORSMiddleware(
    app,
    allow_origins=["*"],
    allow_credentials=True,
)
