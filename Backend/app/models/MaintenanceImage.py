"""Maintenance Image Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class MaintenanceImage(Model):

    __fillable__ = [
        "maintenance_record_id",
        "before_image_path",
        "after_image_path",
        "improvement_score",
    ]

    @belongs_to(
        "maintenance_record_id",
        "id"
    )
    def maintenance_record(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord