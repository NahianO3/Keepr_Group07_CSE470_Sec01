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

    def provider_owns_record(self, request, record):
        """Check whether the logged-in provider owns the record."""

        provider = request.user()

        if not provider:
            return False

        return record.service_provider_id == provider.id

    def customer_owns_record(self, request, record):
        """Check whether the logged-in customer owns the record."""

        customer = request.user()

        if not customer:
            return False

        appliance = Appliance.find(record.appliance_id)

        if not appliance:
            return False

        return appliance.customer_id == customer.id

    def index(self, request: Request):
        """Return maintenance records belonging to the logged-in customer."""

        customer = request.user()

        appliance_id = request.input("appliance_id")

        if appliance_id:
            appliance = Appliance.find(appliance_id)

            if not appliance:
                return {
                    "success": False,
                    "message": "Appliance not found.",
                }, 404

            if not self.customer_owns_appliance(request, appliance):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to access "
                        "this appliance."
                    ),
                }, 403

            records = MaintenanceRecord.where(
                "appliance_id",
                appliance_id
            ).get()

        else:
            customer_appliances = Appliance.where(
                "customer_id",
                customer.id
            ).get()

            owned_appliance_ids = {
                appliance.id
                for appliance in customer_appliances
            }

            all_records = MaintenanceRecord.all()

            records = [
                record
                for record in all_records
                if record.appliance_id in owned_appliance_ids
            ]

        data = [
            self.record_to_dict(record)
            for record in records
        ]

        return {
            "success": True,
            "data": data,
        }

    def show(self, request: Request):
        """Return one maintenance record belonging to the customer."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to access "
                    "this maintenance record."
                ),
            }, 403

        return {
            "success": True,
            "data": self.record_to_dict(record),
        }

    def store(self, request: Request):
        """Create a maintenance record for the customer's appliance."""

        appliance_id = request.input("appliance_id")
        service_provider_id = request.input("service_provider_id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        if not self.customer_owns_appliance(request, appliance):
            return {
                "success": False,
                "message": (
                    "You do not have permission to create "
                    "a maintenance record for this appliance."
                ),
            }, 403

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
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        if cost == "":
            cost = None
        elif cost is not None:
            try:
                cost = float(cost)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid cost.",
                }, 400

        record = MaintenanceRecord.create({
            "appliance_id": appliance_id,
            "service_provider_id": service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": maintenance_type,
            "work_performed": work_performed,
            "cost": cost,
            "status": status or "Pending",
        })

        return {
            "success": True,
            "message": "Maintenance record created successfully.",
            "data": self.record_to_dict(record),
        }, 201

    def provider_requests(self, request: Request):
        """Return maintenance requests assigned to the logged-in provider."""

        provider = request.user()

        if not provider:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        records = MaintenanceRecord.where(
            "service_provider_id",
            provider.id
        ).get()

        data = [
            self.record_to_dict(record)
            for record in records
        ]

        return {
            "success": True,
            "data": data,
        }

    def accept(self, request: Request):
        """Accept a maintenance request."""

        record_id = request.param("id")
        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.provider_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                ),
            }, 403

        if record.status not in ["Pending", "Rejected"]:
            return {
                "success": False,
                "message": "This maintenance request cannot be accepted.",
            }, 409

        record.status = "Accepted"
        record.save()

        return {
            "success": True,
            "message": "Maintenance request accepted successfully.",
            "data": self.record_to_dict(record),
        }

    def reject(self, request: Request):
        """Reject a maintenance request."""

        record_id = request.param("id")
        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.provider_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                ),
            }, 403

        if record.status in ["Completed", "Rejected"]:
            return {
                "success": False,
                "message": "This maintenance request cannot be rejected.",
            }, 409

        record.status = "Rejected"
        record.save()

        return {
            "success": True,
            "message": "Maintenance request rejected successfully.",
            "data": self.record_to_dict(record),
        }

    def reschedule(self, request: Request):
        """Reschedule a maintenance request."""

        record_id = request.param("id")
        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.provider_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                ),
            }, 403

        new_date = request.input("maintenance_date")

        if not new_date:
            return {
                "success": False,
                "message": "maintenance_date is required.",
            }, 400

        try:
            new_date = date.fromisoformat(new_date)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        if record.status == "Completed":
            return {
                "success": False,
                "message": "Completed maintenance cannot be rescheduled.",
            }, 409

        record.maintenance_date = new_date
        record.status = "Rescheduled"
        record.save()

        return {
            "success": True,
            "message": "Maintenance request rescheduled successfully.",
            "data": self.record_to_dict(record),
        }

    def update_progress(self, request: Request):
        """Update maintenance progress/status."""

        record_id = request.param("id")
        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.provider_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                ),
            }, 403

        status = request.input("status")

        work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        if not status:
            return {
                "success": False,
                "message": "status is required.",
            }, 400

        allowed_statuses = [
            "Accepted",
            "In Progress",
            "Rescheduled",
            "Completed",
            "Rejected",
        ]

        if status not in allowed_statuses:
            return {
                "success": False,
                "message": (
                    "Invalid status. Use one of: "
                    + ", ".join(allowed_statuses)
                ),
            }, 400

        if record.status == "Completed":
            return {
                "success": False,
                "message": "Completed maintenance cannot be updated.",
            }, 409

        record.status = status
        record.work_performed = work_performed
        record.save()

        return {
            "success": True,
            "message": "Maintenance progress updated successfully.",
            "data": self.record_to_dict(record),
        }

    def complete(self, request: Request):
        """Complete maintenance and calculate the next service date."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.provider_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                ),
            }, 403

        if record.status == "Completed":
            return {
                "success": False,
                "message": "Maintenance record is already completed.",
            }, 409

        maintenance_date = record.maintenance_date

        if isinstance(maintenance_date, str):
            try:
                maintenance_date = date.fromisoformat(maintenance_date)
            except (ValueError, TypeError):
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
        """Update a maintenance record belonging to the customer."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this maintenance record."
                ),
            }, 403

        maintenance_date = request.input("maintenance_date")

        if maintenance_date:
            try:
                maintenance_date = date.fromisoformat(
                    maintenance_date
                )
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": (
                        "Invalid maintenance_date format. "
                        "Use YYYY-MM-DD."
                    ),
                }, 400
        else:
            maintenance_date = record.maintenance_date

        cost = request.input(
            "cost",
            record.cost
        )

        if cost == "":
            cost = None
        elif cost is not None:
            try:
                cost = float(cost)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid cost.",
                }, 400

        record.maintenance_date = maintenance_date

        record.maintenance_type = request.input(
            "maintenance_type",
            record.maintenance_type
        )

        record.work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        record.cost = cost

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
        """Delete a maintenance record belonging to the customer."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found.",
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this maintenance record."
                ),
            }, 403

        record.delete()

        return {
            "success": True,
            "message": "Maintenance record deleted successfully.",
        }

    def customer_owns_appliance(self, request, appliance):
        """Check whether the logged-in customer owns the appliance."""

        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id