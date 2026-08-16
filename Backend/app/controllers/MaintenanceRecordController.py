"""Maintenance Record Controller."""

from datetime import date

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Appliance import Appliance
from app.models.User import User


class MaintenanceRecordController(Controller):

    # ---------------------------------------------------------
    # Helper: Convert record to JSON
    # ---------------------------------------------------------
    def record_to_dict(self, record):
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

    # ---------------------------------------------------------
    # Helper: Check customer owns appliance
    # ---------------------------------------------------------
    def customer_owns_appliance(self, request, appliance):
        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id

    # ---------------------------------------------------------
    # Helper: Check customer owns maintenance record
    # ---------------------------------------------------------
    def customer_owns_record(self, request, record):
        customer = request.user()

        if not customer:
            return False

        appliance = Appliance.find(record.appliance_id)

        if not appliance:
            return False

        return appliance.customer_id == customer.id

    # ---------------------------------------------------------
    # GET ALL MAINTENANCE RECORDS
    # ---------------------------------------------------------
    def index(self, request: Request):

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        appliance_id = request.input("appliance_id")

        # If a specific vehicle/appliance is requested
        if appliance_id:

            appliance = Appliance.find(appliance_id)

            if not appliance:
                return {
                    "success": False,
                    "message": "Vehicle not found."
                }, 404

            if not self.customer_owns_appliance(request, appliance):
                return {
                    "success": False,
                    "message": "You do not have permission to access this vehicle."
                }, 403

            records = MaintenanceRecord.where(
                "appliance_id",
                appliance_id
            ).get()

        else:

            # Get all vehicles owned by customer
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

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in records
            ]
        }

    # ---------------------------------------------------------
    # GET ONE MAINTENANCE RECORD
    # ---------------------------------------------------------
    def show(self, request: Request):

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": "You do not have permission to access this record."
            }, 403

        return {
            "success": True,
            "data": self.record_to_dict(record)
        }

    # ---------------------------------------------------------
    # CREATE MAINTENANCE RECORD
    # ---------------------------------------------------------
    def store(self, request: Request):

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        appliance_id = request.input("appliance_id")

        # -----------------------------------------------------
        # Check vehicle
        # -----------------------------------------------------
        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Vehicle not found."
            }, 404

        if not self.customer_owns_appliance(request, appliance):
            return {
                "success": False,
                "message": (
                    "You do not have permission to create "
                    "a maintenance record for this vehicle."
                )
            }, 403

        # -----------------------------------------------------
        # Get input
        # -----------------------------------------------------
        maintenance_date = request.input("maintenance_date")
        maintenance_type = request.input("maintenance_type")
        work_performed = request.input("work_performed")
        cost = request.input("cost")
        status = request.input("status")

        # -----------------------------------------------------
        # Validate required fields
        # -----------------------------------------------------
        if not maintenance_date:
            return {
                "success": False,
                "message": "maintenance_date is required."
            }, 400

        if not maintenance_type:
            return {
                "success": False,
                "message": "maintenance_type is required."
            }, 400

        if not work_performed:
            return {
                "success": False,
                "message": "work_performed is required."
            }, 400

        # -----------------------------------------------------
        # IMPORTANT FOR FEATURE 4
        #
        # maintenance_type must be either:
        # DIY
        # Mechanic
        # -----------------------------------------------------
        allowed_types = [
            "DIY",
            "Mechanic"
        ]

        if maintenance_type not in allowed_types:
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_type. "
                    "Use either DIY or Mechanic."
                )
            }, 400

        # -----------------------------------------------------
        # Date validation
        # -----------------------------------------------------
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
                )
            }, 400

        # -----------------------------------------------------
        # Cost validation
        # -----------------------------------------------------
        if cost == "":
            cost = 0

        elif cost is not None:

            try:
                cost = float(cost)

            except (ValueError, TypeError):

                return {
                    "success": False,
                    "message": "Invalid cost."
                }, 400

        # -----------------------------------------------------
        # DIY RECORD
        # -----------------------------------------------------
        if maintenance_type == "DIY":

            # DIY does not need a mechanic
            service_provider_id = None

        # -----------------------------------------------------
        # MECHANIC RECORD
        # -----------------------------------------------------
        else:

            service_provider_id = request.input(
                "service_provider_id"
            )

            if not service_provider_id:
                return {
                    "success": False,
                    "message": (
                        "service_provider_id is required "
                        "for mechanic maintenance."
                    )
                }, 400

            service_provider = User.find(
                service_provider_id
            )

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

        # -----------------------------------------------------
        # CREATE RECORD
        # -----------------------------------------------------
        record = MaintenanceRecord.create({
            "appliance_id": appliance_id,
            "service_provider_id": service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": maintenance_type,
            "work_performed": work_performed,
            "cost": cost,
            "status": status or "Completed",
        })

        return {
            "success": True,
            "message": (
                "DIY maintenance record created successfully."
                if maintenance_type == "DIY"
                else "Mechanic maintenance record created successfully."
            ),
            "data": self.record_to_dict(record)
        }, 201

    # ---------------------------------------------------------
    # UPDATE MAINTENANCE RECORD
    # ---------------------------------------------------------
    def update(self, request: Request):

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this maintenance record."
                )
            }, 403

        # -----------------------------------------------------
        # Date
        # -----------------------------------------------------
        maintenance_date = request.input(
            "maintenance_date",
            record.maintenance_date
        )

        if isinstance(maintenance_date, str):

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
                    )
                }, 400

        # -----------------------------------------------------
        # Maintenance type
        # -----------------------------------------------------
        maintenance_type = request.input(
            "maintenance_type",
            record.maintenance_type
        )

        allowed_types = [
            "DIY",
            "Mechanic"
        ]

        if maintenance_type not in allowed_types:
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_type. "
                    "Use either DIY or Mechanic."
                )
            }, 400

        # -----------------------------------------------------
        # Work performed
        # -----------------------------------------------------
        work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        # -----------------------------------------------------
        # Cost
        # -----------------------------------------------------
        cost = request.input(
            "cost",
            record.cost
        )

        if cost == "":
            cost = 0

        elif cost is not None:

            try:
                cost = float(cost)

            except (ValueError, TypeError):

                return {
                    "success": False,
                    "message": "Invalid cost."
                }, 400

        # -----------------------------------------------------
        # Update service provider
        # -----------------------------------------------------
        if maintenance_type == "DIY":

            service_provider_id = None

        else:

            service_provider_id = request.input(
                "service_provider_id",
                record.service_provider_id
            )

            if not service_provider_id:
                return {
                    "success": False,
                    "message": (
                        "service_provider_id is required "
                        "for mechanic maintenance."
                    )
                }, 400

            service_provider = User.find(
                service_provider_id
            )

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

        # -----------------------------------------------------
        # Save
        # -----------------------------------------------------
        record.maintenance_date = maintenance_date
        record.maintenance_type = maintenance_type
        record.work_performed = work_performed
        record.cost = cost
        record.service_provider_id = service_provider_id

        record.save()

        return {
            "success": True,
            "message": "Maintenance record updated successfully.",
            "data": self.record_to_dict(record)
        }

    # ---------------------------------------------------------
    # DELETE MAINTENANCE RECORD
    # ---------------------------------------------------------
    def destroy(self, request: Request):

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.customer_owns_record(request, record):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this maintenance record."
                )
            }, 403

        record.delete()

        return {
            "success": True,
            "message": "Maintenance record deleted successfully."
        }

    # ---------------------------------------------------------
    # GET ONLY DIY RECORDS
    # ---------------------------------------------------------
    def diy_records(self, request: Request):

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        customer_appliances = Appliance.where(
            "customer_id",
            customer.id
        ).get()

        owned_appliance_ids = {
            appliance.id
            for appliance in customer_appliances
        }

        all_records = MaintenanceRecord.all()

        diy_records = [
            record
            for record in all_records
            if (
                record.appliance_id in owned_appliance_ids
                and record.maintenance_type == "DIY"
            )
        ]

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in diy_records
            ]
        }

    # ---------------------------------------------------------
    # GET ONLY MECHANIC RECORDS
    # ---------------------------------------------------------
    def mechanic_records(self, request: Request):

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        customer_appliances = Appliance.where(
            "customer_id",
            customer.id
        ).get()

        owned_appliance_ids = {
            appliance.id
            for appliance in customer_appliances
        }

        all_records = MaintenanceRecord.all()

        mechanic_records = [
            record
            for record in all_records
            if (
                record.appliance_id in owned_appliance_ids
                and record.maintenance_type == "Mechanic"
            )
        ]

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in mechanic_records
            ]
        }