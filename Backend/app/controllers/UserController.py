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

        # Administrators cannot self-register.
        if role not in ["customer", "service_provider"]:
            return {
                "success": False,
                "message": "Invalid account type.",
            }, 400

        if not full_name or not email or not password:
            return {
                "success": False,
                "message": "Full name, email and password are required.",
            }, 400

        existing_user = User.where("email", email).first()

        if existing_user:
            return {
                "success": False,
                "message": "An account with this email already exists.",
            }, 409

        hashed_password = Hash.make(password)

        account_status = (
            "pending"
            if role == "service_provider"
            else "active"
        )

        user = User.create({
            "full_name": full_name,
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "address": address,
            "role": role,
            "account_status": account_status,
        })

        message = (
            "Service provider account created successfully. "
            "Your account is awaiting administrator approval."
            if role == "service_provider"
            else "Account created successfully."
        )

        return {
            "success": True,
            "message": message,
            "data": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "role": user.role,
                "account_status": user.account_status,
            },
        }, 201

    def login(self, request: Request):
        """
        Credential check helper.

        The actual /api/auth JWT login is handled by Masonite's
        AuthenticationController.
        """

        email = request.input("email")
        password = request.input("password")

        user = User.where("email", email).first()

        if not user:
            return {
                "success": False,
                "message": "Invalid email or password.",
            }, 401

        if not Hash.check(password, user.password):
            return {
                "success": False,
                "message": "Invalid email or password.",
            }, 401

        if user.account_status == "pending":
            return {
                "success": False,
                "message": (
                    "Your service provider account is awaiting "
                    "administrator approval."
                ),
            }, 403

        if user.account_status == "suspended":
            return {
                "success": False,
                "message": "Your account has been suspended.",
            }, 403

        return {
            "success": True,
            "message": "Login credentials are valid.",
            "data": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "account_status": user.account_status,
            },
        }