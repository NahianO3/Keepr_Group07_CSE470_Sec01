"""User Model."""
import jwt
from masonite.environment import env
from masoniteorm.models import Model
from masonite.authentication import Authenticates
from masonite.authorization import Authorizes


class User(Model, Authenticates, Authorizes):

    __fillable__ = [
        "full_name",
        "email",
        "password",
        "phone",
        "address",
        "role",
        "account_status",
        "service_category",
        "service_area",
        "bio",
        "hourly_rate",
        "rating",
        "rating_count",
        "completed_service_count",
        "is_available",
    ]
    __hidden__ = [
        "password",
    ]

    __auth__ = "email"
    def generate_jwt(self):
        payload = {
            "user_id": self.id,
            "email": self.email,
            "role": self.role,
        }

        return jwt.encode(
            payload,
            env("JWT_SECRET"),
            algorithm="HS512"
        )