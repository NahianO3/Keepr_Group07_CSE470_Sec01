"""Review Model for completed maintenance services."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Review(Model):

    __fillable__ = [
        "customer_id",
        "service_provider_id",
        "maintenance_record_id",
        "review",
    ]

    @belongs_to("customer_id", "id")
    def customer(self):
        from app.models.User import User
        return User

    @belongs_to("service_provider_id", "id")
    def service_provider(self):
        from app.models.User import User
        return User

    @belongs_to("maintenance_record_id", "id")
    def maintenance_record(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord