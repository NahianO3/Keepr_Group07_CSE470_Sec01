"""Maintenance Record Controller."""

from datetime import date, timedelta

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle
from app.models.User import User


class MaintenanceRecordController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def record_to_dict(self, record):
        """Convert maintenance record to JSON-safe data."""

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
            "vehicle_id": record.vehicle_id,
            "service_provider_id": record.service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": record.maintenance_type,
            "work_performed": record.work_performed,
            "cost": record.cost,
            "status": record.status,
            "created_at": created_at,
            "updated_at": updated_at,
        }

    def customer_owns_appliance(self, request, appliance):
        """Check whether logged-in customer owns appliance."""

        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id

    def customer_owns_vehicle(self, request, vehicle):
        """Check whether logged-in customer owns vehicle."""

        customer = request.user()

        if not customer:
            return False

        return vehicle.customer_id == customer.id

    def customer_owns_record(self, request, record):
        """Check whether logged-in customer owns maintenance record."""

        customer = request.user()

        if not customer:
            return False

        if record.appliance_id is not None:
            appliance = Appliance.find(record.appliance_id)

            if not appliance:
                return False

            return self.customer_owns_appliance(
                request,
                appliance
            )

        if record.vehicle_id is not None:
            vehicle = Vehicle.find(record.vehicle_id)

            if not vehicle:
                return False

            return self.customer_owns_vehicle(
                request,
                vehicle
            )

        return False

    def provider_owns_record(self, request, record):
        """Check whether logged-in provider owns maintenance record."""

        provider = request.user()

        if not provider:
            return False

        return record.service_provider_id == provider.id

    def owned_appliance_ids(self, customer):
        """Return appliance IDs owned by customer."""

        return {
            appliance.id
            for appliance in Appliance.where(
                "customer_id",
                customer.id
            ).get()
        }

    def owned_vehicle_ids(self, customer):
        """Return vehicle IDs owned by customer."""

        return {
            vehicle.id
            for vehicle in Vehicle.where(
                "customer_id",
                customer.id
            ).get()
        }

    # =========================================================
    # CUSTOMER
    # =========================================================

    def index(self, request: Request):
        """Get maintenance records belonging to logged-in customer."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        appliance_id = request.input("appliance_id")
        vehicle_id = request.input("vehicle_id")

        if appliance_id:

            appliance = Appliance.find(appliance_id)

            if not appliance:
                return {
                    "success": False,
                    "message": "Appliance not found."
                }, 404

            if not self.customer_owns_appliance(
                request,
                appliance
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to access "
                        "this appliance."
                    )
                }, 403

            records = MaintenanceRecord.where(
                "appliance_id",
                appliance_id
            ).get()

        elif vehicle_id:

            vehicle = Vehicle.find(vehicle_id)

            if not vehicle:
                return {
                    "success": False,
                    "message": "Vehicle not found."
                }, 404

            if not self.customer_owns_vehicle(
                request,
                vehicle
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to access "
                        "this vehicle."
                    )
                }, 403

            records = MaintenanceRecord.where(
                "vehicle_id",
                vehicle_id
            ).get()

        else:

            owned_appliance_ids = (
                self.owned_appliance_ids(customer)
            )

            owned_vehicle_ids = (
                self.owned_vehicle_ids(customer)
            )

            all_records = MaintenanceRecord.all()

            records = [
                record
                for record in all_records
                if (
                    record.appliance_id in owned_appliance_ids
                    or record.vehicle_id in owned_vehicle_ids
                )
            ]

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in records
            ]
        }

    def show(self, request: Request):
        """Get one maintenance record belonging to customer."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

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
                    "You do not have permission to access "
                    "this maintenance record."
                )
            }, 403

        return {
            "success": True,
            "data": self.record_to_dict(record)
        }

    def store(self, request: Request):
        """
        Create a maintenance record.

        DIY:
            service_provider_id = NULL
            status defaults to Completed

        Mechanic:
            service_provider_id is required
            status defaults to Pending

        Exactly one asset is required:
            appliance_id OR vehicle_id
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        appliance_id = request.input("appliance_id")
        vehicle_id = request.input("vehicle_id")

        if bool(appliance_id) == bool(vehicle_id):
            return {
                "success": False,
                "message": (
                    "Provide either appliance_id or "
                    "vehicle_id, never both."
                )
            }, 400

        if appliance_id:

            appliance = Appliance.find(appliance_id)

            if not appliance:
                return {
                    "success": False,
                    "message": "Appliance not found."
                }, 404

            if not self.customer_owns_appliance(
                request,
                appliance
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to create "
                        "a maintenance record for this appliance."
                    )
                }, 403

        else:

            vehicle = Vehicle.find(vehicle_id)

            if not vehicle:
                return {
                    "success": False,
                    "message": "Vehicle not found."
                }, 404

            if not self.customer_owns_vehicle(
                request,
                vehicle
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to create "
                        "a maintenance record for this vehicle."
                    )
                }, 403

        maintenance_date = request.input(
            "maintenance_date"
        )

        maintenance_type = request.input(
            "maintenance_type"
        )

        work_performed = request.input(
            "work_performed"
        )

        cost = request.input("cost")

        status = request.input("status")

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

        if maintenance_type == "DIY":

            service_provider_id = None

            record_status = (
                status or "Completed"
            )

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
                        "Selected user is not a "
                        "service provider."
                    )
                }, 400

            record_status = (
                status or "Pending"
            )

        record = MaintenanceRecord.create({
            "appliance_id": appliance_id or None,
            "vehicle_id": vehicle_id or None,
            "service_provider_id": service_provider_id,
            "maintenance_date": maintenance_date,
            "maintenance_type": maintenance_type,
            "work_performed": work_performed,
            "cost": cost,
            "status": record_status,
        })

        return {
            "success": True,
            "message": (
                "DIY maintenance record created successfully."
                if maintenance_type == "DIY"
                else "Mechanic maintenance request created successfully."
            ),
            "data": self.record_to_dict(record)
        }, 201

    def update(self, request: Request):
        """Update a customer-owned maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

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
                    "You do not have permission to update "
                    "this maintenance record."
                )
            }, 403

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

        work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        if not work_performed:
            return {
                "success": False,
                "message": "work_performed is required."
            }, 400

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
                        "Selected user is not a "
                        "service provider."
                    )
                }, 400

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

    def destroy(self, request: Request):
        """Delete a customer-owned maintenance record."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

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
                    "You do not have permission to delete "
                    "this maintenance record."
                )
            }, 403

        record.delete()

        return {
            "success": True,
            "message": "Maintenance record deleted successfully."
        }

    # =========================================================
    # DIY / MECHANIC FILTERS
    # =========================================================

    def diy_records(self, request: Request):
        """Return only DIY maintenance records."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        owned_appliance_ids = (
            self.owned_appliance_ids(customer)
        )

        owned_vehicle_ids = (
            self.owned_vehicle_ids(customer)
        )

        all_records = MaintenanceRecord.all()

        diy_records = [
            record
            for record in all_records
            if (
                record.maintenance_type == "DIY"
                and (
                    record.appliance_id
                    in owned_appliance_ids
                    or record.vehicle_id
                    in owned_vehicle_ids
                )
            )
        ]

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in diy_records
            ]
        }

    def mechanic_records(self, request: Request):
        """Return only mechanic maintenance records."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        owned_appliance_ids = (
            self.owned_appliance_ids(customer)
        )

        owned_vehicle_ids = (
            self.owned_vehicle_ids(customer)
        )

        all_records = MaintenanceRecord.all()

        mechanic_records = [
            record
            for record in all_records
            if (
                record.maintenance_type == "Mechanic"
                and (
                    record.appliance_id
                    in owned_appliance_ids
                    or record.vehicle_id
                    in owned_vehicle_ids
                )
            )
        ]

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in mechanic_records
            ]
        }

    # =========================================================
    # SERVICE PROVIDER
    # =========================================================

    def provider_requests(self, request: Request):
        """Return maintenance requests assigned to provider."""

        provider = request.user()

        if not provider:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        records = MaintenanceRecord.where(
            "service_provider_id",
            provider.id
        ).get()

        return {
            "success": True,
            "data": [
                self.record_to_dict(record)
                for record in records
            ]
        }

    def accept(self, request: Request):
        """Accept a maintenance request."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.provider_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                )
            }, 403

        if record.status not in [
            "Pending",
            "Rejected"
        ]:
            return {
                "success": False,
                "message": (
                    "This maintenance request "
                    "cannot be accepted."
                )
            }, 409

        record.status = "Accepted"
        record.save()

        return {
            "success": True,
            "message": (
                "Maintenance request accepted successfully."
            ),
            "data": self.record_to_dict(record)
        }

    def reject(self, request: Request):
        """Reject a maintenance request."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.provider_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                )
            }, 403

        if record.status in [
            "Completed",
            "Rejected"
        ]:
            return {
                "success": False,
                "message": (
                    "This maintenance request cannot be rejected."
                )
            }, 409

        record.status = "Rejected"
        record.save()

        return {
            "success": True,
            "message": (
                "Maintenance request rejected successfully."
            ),
            "data": self.record_to_dict(record)
        }

    def reschedule(self, request: Request):
        """Reschedule a maintenance request."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.provider_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                )
            }, 403

        if record.status == "Completed":
            return {
                "success": False,
                "message": (
                    "Completed maintenance cannot be rescheduled."
                )
            }, 409

        new_date = request.input(
            "maintenance_date"
        )

        if not new_date:
            return {
                "success": False,
                "message": "maintenance_date is required."
            }, 400

        try:
            new_date = date.fromisoformat(
                new_date
            )

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid maintenance_date format. "
                    "Use YYYY-MM-DD."
                )
            }, 400

        record.maintenance_date = new_date
        record.status = "Rescheduled"

        record.save()

        return {
            "success": True,
            "message": (
                "Maintenance request rescheduled successfully."
            ),
            "data": self.record_to_dict(record)
        }

    def update_progress(self, request: Request):
        """Update maintenance progress."""

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.provider_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                )
            }, 403

        if record.status == "Completed":
            return {
                "success": False,
                "message": (
                    "Completed maintenance cannot be updated."
                )
            }, 409

        status = request.input("status")

        work_performed = request.input(
            "work_performed",
            record.work_performed
        )

        allowed_statuses = [
            "Accepted",
            "In Progress",
            "Rescheduled"
        ]

        if not status:
            return {
                "success": False,
                "message": "status is required."
            }, 400

        if status not in allowed_statuses:
            return {
                "success": False,
                "message": (
                    "Invalid status. Use one of: "
                    + ", ".join(allowed_statuses)
                )
            }, 400

        if not work_performed:
            return {
                "success": False,
                "message": "work_performed is required."
            }, 400

        record.status = status
        record.work_performed = work_performed

        record.save()

        return {
            "success": True,
            "message": (
                "Maintenance progress updated successfully."
            ),
            "data": self.record_to_dict(record)
        }

    def complete(self, request: Request):
        """
        Complete a mechanic maintenance request.

        For an appliance:
            Advance its recurring appliance schedule.

        For a vehicle:
            Advance its recurring vehicle schedule,
            including the time and mileage thresholds.
        """

        record_id = request.param("id")

        record = MaintenanceRecord.find(record_id)

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.provider_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to manage "
                    "this maintenance request."
                )
            }, 403

        if record.maintenance_type != "Mechanic":
            return {
                "success": False,
                "message": (
                    "Only mechanic maintenance requests "
                    "can be completed by a service provider."
                )
            }, 400

        if record.status == "Completed":
            return {
                "success": False,
                "message": (
                    "Maintenance record is already completed."
                )
            }, 409

        maintenance_date = record.maintenance_date

        if isinstance(maintenance_date, str):

            try:
                maintenance_date = date.fromisoformat(
                    maintenance_date
                )

            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid maintenance date."
                }, 400

        # -----------------------------------------------------
        # Complete record
        # -----------------------------------------------------

        record.status = "Completed"

        record.save()

        # -----------------------------------------------------
        # Module 3 Feature 6:
        # update provider completed-service count
        # -----------------------------------------------------

        provider = request.user()

        if provider:

            provider.completed_service_count = (
                provider.completed_service_count or 0
            ) + 1

            provider.save()

        # =====================================================
        # APPLIANCE SCHEDULE
        # =====================================================

        if record.appliance_id is not None:

            schedule = MaintenanceSchedule.where(
                "appliance_id",
                record.appliance_id
            ).first()

            if schedule and schedule.interval_days:

                try:
                    interval_days = int(
                        schedule.interval_days
                    )

                except (ValueError, TypeError):
                    interval_days = 0

                if interval_days > 0:

                    next_service_date = (
                        maintenance_date
                        + timedelta(
                            days=interval_days
                        )
                    )

                    schedule.next_service_date = (
                        next_service_date
                    )

                    schedule.save()

        # =====================================================
        # VEHICLE SCHEDULE
        # =====================================================

        elif record.vehicle_id is not None:

            vehicle = Vehicle.find(
                record.vehicle_id
            )

            if vehicle:

                schedule = MaintenanceSchedule.where(
                    "vehicle_id",
                    record.vehicle_id
                ).first()

                if schedule:

                    if schedule.interval_days:

                        try:
                            interval_days = int(
                                schedule.interval_days
                            )

                        except (ValueError, TypeError):
                            interval_days = 0

                        if interval_days > 0:

                            schedule.next_service_date = (
                                maintenance_date
                                + timedelta(
                                    days=interval_days
                                )
                            )

                    if vehicle.maintenance_interval_km:

                        try:
                            interval_km = float(
                                vehicle.maintenance_interval_km
                            )

                        except (
                            ValueError,
                            TypeError
                        ):
                            interval_km = None

                        if interval_km is not None:

                            base_mileage = (
                                vehicle.current_mileage
                            )

                            if base_mileage is None:
                                base_mileage = (
                                    vehicle.last_service_mileage
                                )

                            if base_mileage is not None:

                                schedule.next_service_mileage = (
                                    float(base_mileage)
                                    + interval_km
                                )

                    schedule.save()

        return {
            "success": True,
            "message": (
                "Maintenance completed successfully."
            ),
            "data": self.record_to_dict(record)
        }