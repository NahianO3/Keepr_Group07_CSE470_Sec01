"""MaintenanceSchedule Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class MaintenanceSchedule(Model):

    __fillable__ = [
        "appliance_id",
        "vehicle_id",
        "next_service_date",
        "next_service_mileage",
        "interval_days",
        "reminder_enabled",
    ]

    @belongs_to("appliance_id", "id")
    def appliance(self):
        from app.models.Appliance import Appliance
        return Appliance

    @belongs_to("vehicle_id", "id")
    def vehicle(self):
        from app.models.Vehicle import Vehicle
        return Vehicle
