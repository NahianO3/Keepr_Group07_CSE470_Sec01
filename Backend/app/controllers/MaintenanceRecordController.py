"""Maintenance Record Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Appliance import Appliance
from app.models.User import User


class MaintenanceRecordController(Controller):

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

        return {
            "success": True,
            "data": list(records),
        }

    def show(self, request: Request):
        """Return one maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        return {
            "success": True,
            "data": record,
        }

    def store(self, request: Request):
        """Create a maintenance record."""

        appliance_id = request.input("appliance_id")
        service_provider_id = request.input("service_provider_id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found."
            }, 404

        service_provider = User.find(service_provider_id)

        if not service_provider:
            return {
                "success": False,
                "message": "Service provider not found."
            }, 404

        if service_provider.role != "service_provider":
            return {
                "success": False,
                "message": (
                    "Selected user is not a service provider."
                )
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
                )
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
            "data": record,
        }, 201

    def update(self, request: Request):
        """Update a maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        record.maintenance_date = request.input(
            "maintenance_date",
            record.maintenance_date
        )

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
            "data": record,
        }

    def destroy(self, request: Request):
        """Delete a maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        record.delete()

        return {
            "success": True,
            "message": "Maintenance record deleted successfully.",
        }