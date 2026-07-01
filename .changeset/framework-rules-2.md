---
"oauthlint-rules": minor
---

More framework-aware rules (six), each a tight literal pattern validated against
real framework code for a low false-positive rate:

- Django REST Framework: `DEFAULT_PERMISSION_CLASSES = [AllowAny]` (authorization
  off globally), `DEFAULT_AUTHENTICATION_CLASSES = []`, and a per-view
  `authentication_classes = []`.
- Flask / Flask-Login: a session or remember-me cookie flag disabled via
  `app.config[...] = False` / `app.config.update(...)` (the forms the bare-assignment
  rule missed).
- django-cors-headers: `CORS_ALLOW_ALL_ORIGINS = True`.
- Express: an `express-session` / `cookie-session` cookie set to `secure: false`
  or `httpOnly: false`.

The pack is now 155 rules.
