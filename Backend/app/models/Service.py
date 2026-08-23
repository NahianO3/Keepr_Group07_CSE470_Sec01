"""Service Model.

Module 3 - Feature 4: an "offered service" a service provider lists
on their professional profile (e.g. "AC Gas Refill", "Engine
Diagnostics"), distinct from their overall service_category.
"""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Service(Model):

    __fillable__ = [
        "service_provider_id",
        "service_name",
        "category",
        "description",
        "estimated_price",
        "estimated_duration_hours",
    ]

    @belongs_to("service_provider_id", "id")
    def service_provider(self):
        from app.models.User import User
        return User
