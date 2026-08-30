"""Review Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Review(Model):

    __fillable__ = [
        "maintenance_record_id",
        "customer_id",
        "service_provider_id",
        "rating",
        "review",
        "moderation_status",
    ]

    @belongs_to(
        "maintenance_record_id",
        "id"
    )
    def maintenance_record(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord

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