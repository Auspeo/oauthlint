# `auth.py.flow.csrf-exempt`

> A Django view disables CSRF protection. The `@csrf_exempt` decorator

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-FLOW-005` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) |
| **OWASP** | A01:2021 |
| **Languages** | python |
| **Technologies** | django |

## Why this matters

A Django view disables CSRF protection. The `@csrf_exempt` decorator
(from `django.views.decorators.csrf`), or `@method_decorator(csrf_exempt,
...)` on a class-based view, turns off Django's CSRF middleware check for
that endpoint. An attacker can then forge cross-site requests that the
victim's browser submits with their session cookie — a CSRF vulnerability.

Do not exempt views from CSRF. Keep the default protection and submit the
CSRF token from your client. For machine-to-machine endpoints such as
webhooks, validate a signed request signature (e.g. an HMAC header)
instead of disabling CSRF wholesale.

## ❌ Vulnerable

```python
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


# ruleid: auth.py.flow.csrf-exempt
@csrf_exempt
def webhook(request):
    return JsonResponse({"ok": True})


# ruleid: auth.py.flow.csrf-exempt
@csrf_exempt
@require_POST
def receive_event(request):
    return JsonResponse({"ok": True})


# ruleid: auth.py.flow.csrf-exempt
@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(View):
    def post(self, request):
        return JsonResponse({"ok": True})
```

## ✅ Safe

```python
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_POST


# ok: auth.py.flow.csrf-exempt -- protected by default CSRF middleware, no exemption
def submit(request):
    return JsonResponse({"ok": True})


# ok: auth.py.flow.csrf-exempt -- importing csrf_exempt without applying it is fine
@require_POST
def receive_event(request):
    return JsonResponse({"ok": True})


# ok: auth.py.flow.csrf-exempt -- CSRF protection explicitly enforced
@csrf_protect
def update_profile(request):
    return JsonResponse({"ok": True})


# ok: auth.py.flow.csrf-exempt -- class-based view with default protection
@method_decorator(csrf_protect, name="dispatch")
class ProfileView(View):
    def post(self, request):
        return JsonResponse({"ok": True})
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.flow.csrf-exempt -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.djangoproject.com/en/stable/ref/csrf/
- https://cwe.mitre.org/data/definitions/352.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
