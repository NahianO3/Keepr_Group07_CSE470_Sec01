"""Report Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Report import Report
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.User import User
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class ReportController(Controller):

    def customer_owns_record(self, request, record):
        customer = request.user()

        if not customer:
            return False

        if record.appliance_id is not None:
            appliance = Appliance.find(
                record.appliance_id
            )

            return (
                appliance is not None
                and appliance.customer_id == customer.id
            )

        if record.vehicle_id is not None:
            vehicle = Vehicle.find(
                record.vehicle_id
            )

            return (
                vehicle is not None
                and vehicle.customer_id == customer.id
            )

        return False

    def store(self, request: Request):
        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        record = MaintenanceRecord.find(
            request.param("id")
        )

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.customer_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to report "
                    "this maintenance record."
                )
            }, 403

        if record.status != "Completed":
            return {
                "success": False,
                "message": (
                    "A maintenance service can only be "
                    "reported after completion."
                )
            }, 409

        if not record.service_provider_id:
            return {
                "success": False,
                "message": (
                    "This maintenance record has no "
                    "service provider."
                )
            }, 400

        reason = request.input("reason")
        description = request.input(
            "description"
        )

        if not reason:
            return {
                "success": False,
                "message": "reason is required."
            }, 400

        existing = Report.where(
            "maintenance_record_id",
            record.id
        ).where(
            "reporter_id",
            customer.id
        ).first()

        if existing:
            return {
                "success": False,
                "message": (
                    "You have already reported this "
                    "maintenance record."
                )
            }, 409

        report = Report.create({
            "maintenance_record_id": record.id,
            "reporter_id": customer.id,
            "service_provider_id": (
                record.service_provider_id
            ),
            "reason": reason.strip(),
            "description": (
                description.strip()
                if description
                else None
            ),
            "status": "Pending",
        })

        return {
            "success": True,
            "message": "Report submitted successfully.",
            "data": {
                "id": report.id,
                "maintenance_record_id": (
                    report.maintenance_record_id
                ),
                "service_provider_id": (
                    report.service_provider_id
                ),
                "reason": report.reason,
                "description": report.description,
                "status": report.status,
            }
        }, 201