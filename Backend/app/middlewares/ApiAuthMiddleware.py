import jwt

from masonite.middleware import Middleware
from masonite.environment import env

from app.models.User import User


class ApiAuthMiddleware(Middleware):

    def before(self, request, response):
        header = request.header("Authorization")

        if not header or not header.startswith("Bearer "):
            return response.json(
                {
                    "success": False,
                    "message": "Authentication required."
                },
                status=401
            )

        token = header.replace("Bearer ", "", 1)

        try:
            payload = jwt.decode(
                token,
                env("JWT_SECRET"),
                algorithms=["HS512"]
            )
        except Exception:
            return response.json(
                {
                    "success": False,
                    "message": "Invalid or expired token."
                },
                status=401
            )

        user_id = payload.get("user_id")

        if not user_id:
            return response.json(
                {
                    "success": False,
                    "message": "Invalid token."
                },
                status=401
            )

        user = User.find(user_id)

        if not user:
            return response.json(
                {
                    "success": False,
                    "message": "User not found."
                },
                status=401
            )

        request.set_user(user)
        return request

    def after(self, request, response):
        return request