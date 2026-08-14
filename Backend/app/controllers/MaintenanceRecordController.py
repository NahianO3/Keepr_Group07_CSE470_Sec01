"""Maintenance Record Controller."""

from datetime import date, timedelta

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance
from app.models.User import User


class MaintenanceRecordController(Controller):

    def record_to_dict(self, record):
        """Convert a maintenance record model to JSON-safe data."""

        maintenance_date = record.maintenance_date
        if maintenance_date:
            if hasattr(maintenance_date, "isoformat"):
                maintenance_date = maintenance_date.isoformat()
            else:
                maintenance_date = str(maintenance_date)

        created_at = record.created_at
        if created_at:
            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            else:
                created_at = str(created_at)

        updated_at = record.updated_at
        if updated_at:
            if hasattr(updated_at, "isoformat"):
                updated_at = updated_at.isoformat()
            else:
                updated_at = str(updated_at)

        return {
            "id": record.id,
            "appliance_id": record.appliance_id,
            "service_provider_id": record.service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": record.maintenance_type,
            "work_performed": record.work_performed,
            "cost": record.cost,
            "status": record.status,
            "created_at": created_at,
            "updated_at": updated_at,
        }

    def index(self, request: Request):
        """Return maintenance records."""

        appliance_id = request.input("appliance_id")

        if appliance_id:
            records = MaintenanceRecord.where(
                "appliance_id",
                appliance_id
            ).get()
        else:
            records = MaintenanceRecord.all()

        data = [
            self.record_to_dict(record)
            for record in records
        ]

        return {
            "success": True,
            "data": data,
        }

    def show(self, request: Request):
        """Return one maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        return {
            "success": True,
            "data": self.record_to_dict(record),
        }

    def store(self, request: Request):
        """Create a maintenance record."""

        appliance_id = request.input("appliance_id")
        service_provider_id = request.input("service_provider_id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        service_provider = User.find(service_provider_id)

        if not service_provider:
            return {
                "success": False,
                "message": "Service provider not found.",
            }, 404

        if service_provider.role != "service_provider":
            return {
                "success": False,
                "message": "Selected user is not a service provider.",
            }, 400

        maintenance_date = request.input("maintenance_date")
        maintenance_type = request.input("maintenance_type")
        work_performed = request.input("work_performed")
        cost = request.input("cost")
        status = request.input("status")

        if not maintenance_date or not maintenance_type:
            return {
                "success": False,
                "message": (
                    "maintenance_date and maintenance_type "
                    "are required."
                ),
            }, 400

        try:
            maintenance_date = date.fromisoformat(maintenance_date)
        except ValueError:
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        record = MaintenanceRecord.create({
            "appliance_id": appliance_id,
            "service_provider_id": service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": maintenance_type,
            "work_performed": work_performed,
            "cost": cost,
            "status": status,
        })

        return {
            "success": True,
            "message": "Maintenance record created successfully.",
            "data": self.record_to_dict(record),
        }, 201

    def complete(self, request: Request):
        """Complete maintenance and calculate the next service date."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if record.status == "Completed":
            return {
                "success": False,
                "message": "Maintenance record is already completed.",
            }, 409

        maintenance_date = record.maintenance_date

        if isinstance(maintenance_date, str):
            try:
                maintenance_date = date.fromisoformat(maintenance_date)
            except ValueError:
                return {
                    "success": False,
                    "message": "Invalid maintenance date.",
                }, 400

        record.status = "Completed"
        record.save()

        schedule = MaintenanceSchedule.where(
            "appliance_id",
            record.appliance_id
        ).first()

        if schedule and schedule.interval_days:
            next_service_date = (
                maintenance_date
                + timedelta(days=schedule.interval_days)
            )

            schedule.next_service_date = next_service_date
            schedule.save()

        return {
            "success": True,
            "message": "Maintenance completed successfully.",
            "data": self.record_to_dict(record),
        }

    def update(self, request: Request):
        """Update a maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        maintenance_date = request.input("maintenance_date")

        if maintenance_date:
            try:
                maintenance_date = date.fromisoformat(
                    maintenance_date
                )
            except ValueError:
                return {
                    "success": False,
                    "message": (
                        "Invalid maintenance_date format. "
                        "Use YYYY-MM-DD."
                    ),
                }, 400
        else:
            maintenance_date = record.maintenance_date

        record.maintenance_date = maintenance_date

        record.maintenance_type = request.input(
            "maintenance_type",
            record.maintenance_type
        )

        record.work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        record.cost = request.input(
            "cost",
            record.cost
        )

        record.status = request.input(
            "status",
            record.status
        )

        record.save()

        return {
            "success": True,
            "message": "Maintenance record updated successfully.",
            "data": self.record_to_dict(record),
        }

    def destroy(self, request: Request):
        """Delete a maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        record.delete()

        return {
            "success": True,
            "message": "Maintenance record deleted successfully.",
        }