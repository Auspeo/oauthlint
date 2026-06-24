---
'oauthlint-rules': minor
---

Add `auth.py.flow.csrf-exempt` (AUTH-PY-FLOW-005, CWE-352). Flags Django views
that disable CSRF protection via the `@csrf_exempt` decorator or
`@method_decorator(csrf_exempt, ...)` on a class-based view, which exposes the
endpoint to cross-site request forgery. Keep the default protection and, for
webhooks, validate a request signature instead. Scoped to the applied
decorator; a bare `import csrf_exempt` or an unrelated decorator is not matched.
