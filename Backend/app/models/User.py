"""User Model."""
from masonite.api.facades import Api
from masoniteorm.models import Model
from masonite.authentication import Authenticates
from masonite.api.authentication import AuthenticatesTokens
from masonite.authorization import Authorizes


class User(Model, Authenticates, AuthenticatesTokens, Authorizes):

    __fillable__ = [
        "full_name",
        "email",
        "password",
        "phone",
        "address",
        "role",
        "account_status",
    ]

    __hidden__ = [
        "password",
    ]

    __auth__ = "email"
    def generate_jwt(self):
        return Api.generate_token()