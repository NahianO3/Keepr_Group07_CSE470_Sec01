"""User Model."""

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
    ]

    __hidden__ = [
        "password",
    ]

    __auth__ = "email"