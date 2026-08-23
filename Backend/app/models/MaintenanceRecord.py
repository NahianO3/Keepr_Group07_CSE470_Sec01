"""MaintenanceRecord Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to, has_many


class MaintenanceRecord(Model):

    __fillable__ = [
        "appliance_id",
        "vehicle_id",
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

    @belongs_to("vehicle_id", "id")
    def vehicle(self):
        from app.models.Vehicle import Vehicle
        return Vehicle

    @belongs_to("service_provider_id", "id")
    def service_provider(self):
        from app.models.User import User
        return User

    @has_many("id", "maintenance_record_id")
    def reviews(self):
        from app.models.Review import Review
        return Review

    @has_many("id", "maintenance_record_id")
    def reports(self):
        from app.models.Report import Report
        return Report