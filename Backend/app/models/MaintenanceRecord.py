"""MaintenanceRecord Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class MaintenanceRecord(Model):

    __fillable__ = [
        "appliance_id",
        "service_provider_id",
        "maintenance_date",
        "maintenance_type",
        "work_performed",
        "cost",
        "status",
    ]

    @belongs_to("appliance_id", "id")
    def appliance(self):
        from app.models.Appliance import Appliance
        return Appliance

    @belongs_to("service_provider_id", "id")
    def service_provider(self):
        from app.models.User import User
        return User