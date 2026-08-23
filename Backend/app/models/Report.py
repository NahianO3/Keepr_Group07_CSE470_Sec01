"""Report Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Report(Model):

    __fillable__ = [
        "maintenance_record_id",
        "reporter_id",
        "service_provider_id",
        "reason",
        "description",
        "status",
    ]

    @belongs_to(
        "maintenance_record_id",
        "id"
    )
    def maintenance_record(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord

    @belongs_to(
        "reporter_id",
        "id"
    )
    def reporter(self):
        from app.models.User import User
        return User

    @belongs_to(
        "service_provider_id",
        "id"
    )
    def service_provider(self):
        from app.models.User import User
        return User