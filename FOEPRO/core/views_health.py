from django.http import JsonResponse
from django.db import connections, DatabaseError


def health(request):
    try:
        # Execute a minimal query so deployment issues surface as a clear health failure.
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
    except DatabaseError as e:
        return JsonResponse(
            {"status": "error", "detail": "db unavailable", "error": str(e)},
            status=500,
        )
    return JsonResponse({"status": "ok"})
