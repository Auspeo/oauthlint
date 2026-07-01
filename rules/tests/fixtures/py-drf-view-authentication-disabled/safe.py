from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class AccountView(APIView):
    # ok: auth.py.drf.view-authentication-disabled -- populated with a real scheme
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"ok": True})


# ok: auth.py.drf.view-authentication-disabled -- decorator lists a real scheme
@api_view(["GET"])
@authentication_classes([TokenAuthentication])
def account_status(request):
    return Response({"ok": True})
