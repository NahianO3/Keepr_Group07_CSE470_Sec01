"""Expense Model."""

from masoniteorm.models import Model
from masoniteorm.relationships import belongs_to


class Expense(Model):

    __fillable__ = [
        "maintenance_record_id",
        "amount",
        "expense_category",
        "expense_date",
        "description",
    ]

    @belongs_to(
        "maintenance_record_id",
        "id"
    )
    def maintenance_record(self):
        from app.models.MaintenanceRecord import MaintenanceRecord
        return MaintenanceRecord