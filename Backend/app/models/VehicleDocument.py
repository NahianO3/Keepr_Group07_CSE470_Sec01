"""Vehicle Document Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class VehicleDocument(Model):

    __fillable__ = [
        "vehicle_id",
        "document_type",
        "issue_date",
        "expiry_date",
        "document_status",
        "document_path",
    ]

    @belongs_to("vehicle_id", "id")
    def vehicle(self):
        from app.models.Vehicle import Vehicle
        return Vehicle