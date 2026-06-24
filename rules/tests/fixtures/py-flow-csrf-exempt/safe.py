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
