from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session authentication without CSRF enforcement for API endpoints.

    Safe because Django's session cookie defaults to SameSite=Lax which
    prevents cross-origin form submissions, and all API calls originate
    from the same-origin SPA.
    """

    def enforce_csrf(self, request):
        return
