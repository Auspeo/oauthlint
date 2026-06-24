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
