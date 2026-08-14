from masonite.middleware import Middleware


class RoleMiddleware(Middleware):

    def before(self, request, response, role):
        user = request.user()

        if not user:
            return response.json(
                {
                    "success": False,
                    "message": "Authentication required."
                },
                status=401
            )

        if user.role != role:
            return response.json(
                {
                    "success": False,
                    "message": "You do not have permission to access this resource."
                },
                status=403
            )

        return request

    def after(self, request, response, role):
        return request
