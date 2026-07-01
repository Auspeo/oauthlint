from rest_framework.decorators import api_view, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class PublicProfileView(APIView):
    # ruleid: auth.py.drf.view-authentication-disabled
    authentication_classes = []
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"ok": True})


# ruleid: auth.py.drf.view-authentication-disabled
@api_view(["GET"])
@authentication_classes([])
def public_status(request):
    return Response({"ok": True})
