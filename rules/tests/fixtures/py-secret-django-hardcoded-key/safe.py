# Django settings.py

import os

import environ
from decouple import config

env = environ.Env()

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = os.environ["SECRET_KEY"]

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = os.environ.get("SECRET_KEY")

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = env("SECRET_KEY")

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = config("SECRET_KEY")

_loaded_key = os.environ["SECRET_KEY"]
# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = _loaded_key
