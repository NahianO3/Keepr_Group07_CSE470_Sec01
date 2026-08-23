"""Bookmark Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Bookmark(Model):

    __fillable__ = [
        "customer_id",
        "service_provider_id",
    ]

    @belongs_to(
        "customer_id",
        "id"
    )
    def customer(self):
        from app.models.User import User
        return User

    @belongs_to(
        "service_provider_id",
        "id"
    )
    def service_provider(self):
        from app.models.User import User
        return User