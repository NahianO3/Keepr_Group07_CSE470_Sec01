"""Appliance Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to, has_many


class Appliance(Model):

    __fillable__ = [
        "customer_id",
        "category",
        "name",
        "purchase_date",
        "warranty_expiry",
        "maintenance_interval",
        "condition",
    ]

    @belongs_to("customer_id", "id")
    def customer(self):
        from app.models.User import User
        return User

    @has_many("id", "appliance_id")
    def maintenance_schedules(self):
        from app.models.MaintenanceSchedule import MaintenanceSchedule
        return MaintenanceSchedule

    @has_many("id", "appliance_id")
    def maintenance_records(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord