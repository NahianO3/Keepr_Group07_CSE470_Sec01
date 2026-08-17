"""Vehicle Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to, has_many


class Vehicle(Model):

    __fillable__ = [
        "customer_id",
        "brand",
        "model",
        "purchase_date",
        "current_mileage",
        "last_service_mileage",
        "maintenance_interval_km",
        "maintenance_interval_days",
        "insurance_status",
        "registration_status",
        "tax_token_status",
    ]

    @belongs_to("customer_id", "id")
    def customer(self):
        from app.models.User import User
        return User

    @has_many("id", "vehicle_id")
    def maintenance_schedules(self):
        from app.models.MaintenanceSchedule import MaintenanceSchedule
        return MaintenanceSchedule

    @has_many("id", "vehicle_id")
    def vehicle_documents(self):
        from app.models.VehicleDocument import VehicleDocument
        return VehicleDocument