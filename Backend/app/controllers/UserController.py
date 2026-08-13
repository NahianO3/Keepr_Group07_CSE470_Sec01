from masonite.controllers import Controller
from masonite.request import Request
from masonite.facades import Hash

from app.models.User import User


class UserController(Controller):

    def register(self, request: Request):
        """Register a Customer or Service Provider."""

        full_name = request.input("full_name")
        email = request.input("email")
        password = request.input("password")
        phone = request.input("phone")
        address = request.input("address")
        role = request.input("role")

        # Registration is allowed only for these two account types.
        # Administrator accounts are not self-registered.
        if role not in ["customer", "service_provider"]:
            return {
                "success": False,
                "message": "Invalid account type."
            }, 400

        # Basic required-field check.
        if not full_name or not email or not password:
            return {
                "success": False,
                "message": "Full name, email and password are required."
            }, 400

        # Prevent duplicate email addresses.
        existing_user = User.where("email", email).first()

        if existing_user:
            return {
                "success": False,
                "message": "An account with this email already exists."
            }, 409

        # Password is hashed before being stored.
        hashed_password = Hash.make(password)

        user = User.create({
            "full_name": full_name,
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "address": address,
            "role": role,
            "account_status": "active",
        })

        return {
            "success": True,
            "message": "Account created successfully.",
            "data": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "role": user.role,
                "account_status": user.account_status,
            }
        }, 201
