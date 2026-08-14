"""Authentication Controller."""

import uuid
from datetime import datetime, timedelta

from masonite.controllers import Controller
from masonite.request import Request
from masonite.facades import Hash

from app.models.User import User


class AuthenticationController(Controller):

    def logout(self, request: Request):
        """
        API logout.

        JWT authentication is stateless, so the frontend should remove
        the stored token after this successful response.
        """

        return {
            "success": True,
            "message": "Logged out successfully.",
        }

    def password_reset_request(self, request: Request):
        """
        Generate a password reset token for an account.

        For development/testing the token is returned in the response.
        In the final production version this token should be delivered
        through email or OTP.
        """

        email = request.input("email")

        if not email:
            return {
                "success": False,
                "message": "Email is required.",
            }, 400

        user = User.where("email", email).first()

        # Do not reveal whether an email exists.
        if not user:
            return {
                "success": True,
                "message": (
                    "If an account exists for this email, "
                    "a password reset token has been generated."
                ),
            }

        token = str(uuid.uuid4())

        expiration_minutes = 1440

        expires_at = (
            datetime.utcnow()
            + timedelta(minutes=expiration_minutes)
        )

        user.password_reset_token = token
        user.password_reset_expires_at = expires_at
        user.save()

        return {
            "success": True,
            "message": "Password reset token generated.",
            "data": {
                "email": user.email,
                "token": token,
                "expires_at": expires_at.isoformat(),
            },
        }

    def password_reset_confirm(self, request: Request):
        """Reset a password using a valid password reset token."""

        token = request.input("token")
        password = request.input("password")

        if not token or not password:
            return {
                "success": False,
                "message": "Token and password are required.",
            }, 400

        user = User.where(
            "password_reset_token",
            token
        ).first()

        if not user:
            return {
                "success": False,
                "message": "Invalid or expired reset token.",
            }, 400

        expires_at = user.password_reset_expires_at

        if not expires_at:
            return {
                "success": False,
                "message": "Invalid or expired reset token.",
            }, 400

        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid or expired reset token.",
                }, 400

        # Handle timezone-aware database values safely.
        if expires_at.tzinfo is not None:
            now = datetime.now(expires_at.tzinfo)
        else:
            now = datetime.utcnow()

        if expires_at <= now:
            user.password_reset_token = None
            user.password_reset_expires_at = None
            user.save()

            return {
                "success": False,
                "message": "Invalid or expired reset token.",
            }, 400

        user.password = Hash.make(password)

        # Invalidate the token immediately after successful reset.
        user.password_reset_token = None
        user.password_reset_expires_at = None

        user.save()

        return {
            "success": True,
            "message": "Password reset successfully.",
        }