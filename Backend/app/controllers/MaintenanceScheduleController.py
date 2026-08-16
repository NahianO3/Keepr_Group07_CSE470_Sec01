"""Maintenance Schedule Controller."""

from datetime import date

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class MaintenanceScheduleController(Controller):

    # =========================================================
    # SERIALIZATION
    # =========================================================

    def schedule_to_dict(self, schedule):
        """Convert schedule to JSON-safe data."""

        def to_iso(value):
            if not value:
                return value

            return (
                value.isoformat()
                if hasattr(value, "isoformat")
                else str(value)
            )

        return {
            "id": schedule.id,
            "appliance_id": schedule.appliance_id,
            "vehicle_id": schedule.vehicle_id,
            "next_service_date": to_iso(
                schedule.next_service_date
            ),
            "next_service_mileage": (
                schedule.next_service_mileage
            ),
            "interval_days": schedule.interval_days,
            "reminder_enabled": (
                schedule.reminder_enabled
            ),
            "created_at": to_iso(schedule.created_at),
            "updated_at": to_iso(schedule.updated_at),
        }

    # =========================================================
    # OWNERSHIP
    # =========================================================

    def customer_owns_appliance(
        self,
        request,
        appliance
    ):
        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id

    def customer_owns_vehicle(
        self,
        request,
        vehicle
    ):
        customer = request.user()

        if not customer:
            return False

        return vehicle.customer_id == customer.id

    def customer_owns_schedule(
        self,
        request,
        schedule
    ):
        """A schedule belongs to exactly one asset."""

        if schedule.appliance_id is not None:
            appliance = Appliance.find(
                schedule.appliance_id
            )

            if not appliance:
                return False

            return self.customer_owns_appliance(
                request,
                appliance
            )

        if schedule.vehicle_id is not None:
            vehicle = Vehicle.find(
                schedule.vehicle_id
            )

            if not vehicle:
                return False

            return self.customer_owns_vehicle(
                request,
                vehicle
            )

        return False

    def owned_appliance_ids(self, customer):
        return {
            appliance.id
            for appliance in Appliance.where(
                "customer_id",
                customer.id
            ).get()
        }

    def owned_vehicle_ids(self, customer):
        return {
            vehicle.id
            for vehicle in Vehicle.where(
                "customer_id",
                customer.id
            ).get()
        }

    # =========================================================
    # INDEX
    # =========================================================

    def index(self, request: Request):
        """Return schedules belonging to customer."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        appliance_id = request.input(
            "appliance_id"
        )

        vehicle_id = request.input(
            "vehicle_id"
        )

        if appliance_id:

            appliance = Appliance.find(
                appliance_id
            )

            if not appliance:
                return {
                    "success": False,
                    "message": "Appliance not found.",
                }, 404

            if not self.customer_owns_appliance(
                request,
                appliance
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission "
                        "to access this appliance."
                    ),
                }, 403

            schedules = MaintenanceSchedule.where(
                "appliance_id",
                appliance_id
            ).get()

        elif vehicle_id:

            vehicle = Vehicle.find(
                vehicle_id
            )

            if not vehicle:
                return {
                    "success": False,
                    "message": "Vehicle not found.",
                }, 404

            if not self.customer_owns_vehicle(
                request,
                vehicle
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission "
                        "to access this vehicle."
                    ),
                }, 403

            schedules = MaintenanceSchedule.where(
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

            all_schedules = MaintenanceSchedule.all()

            schedules = [
                schedule
                for schedule in all_schedules
                if (
                    schedule.appliance_id
                    in owned_appliance_ids
                    or schedule.vehicle_id
                    in owned_vehicle_ids
                )
            ]

        return {
            "success": True,
            "data": [
                self.schedule_to_dict(schedule)
                for schedule in schedules
            ],
        }

    # =========================================================
    # SHOW
    # =========================================================

    def show(self, request: Request):
        """Return one customer-owned schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(
            schedule_id
        )

        if not schedule:
            return {
                "success": False,
                "message": (
                    "Maintenance schedule not found."
                ),
            }, 404

        if not self.customer_owns_schedule(
            request,
            schedule
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to access "
                    "this maintenance schedule."
                ),
            }, 403

        return {
            "success": True,
            "data": self.schedule_to_dict(schedule),
        }

    # =========================================================
    # CREATE OR UPDATE EXISTING
    # =========================================================

    def store(self, request: Request):
        """
        Create a schedule if one does not exist.

        If the asset already has a schedule, update the existing
        row instead of creating a duplicate.
        """

        appliance_id = request.input(
            "appliance_id"
        )

        vehicle_id = request.input(
            "vehicle_id"
        )

        if bool(appliance_id) == bool(vehicle_id):
            return {
                "success": False,
                "message": (
                    "Provide either appliance_id or "
                    "vehicle_id, never both."
                ),
            }, 400

        if appliance_id:

            appliance = Appliance.find(
                appliance_id
            )

            if not appliance:
                return {
                    "success": False,
                    "message": "Appliance not found.",
                }, 404

            if not self.customer_owns_appliance(
                request,
                appliance
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to "
                        "manage this appliance's schedule."
                    ),
                }, 403

            existing_schedule = (
                MaintenanceSchedule.where(
                    "appliance_id",
                    appliance_id
                ).first()
            )

        else:

            vehicle = Vehicle.find(
                vehicle_id
            )

            if not vehicle:
                return {
                    "success": False,
                    "message": "Vehicle not found.",
                }, 404

            if not self.customer_owns_vehicle(
                request,
                vehicle
            ):
                return {
                    "success": False,
                    "message": (
                        "You do not have permission to "
                        "manage this vehicle's schedule."
                    ),
                }, 403

            existing_schedule = (
                MaintenanceSchedule.where(
                    "vehicle_id",
                    vehicle_id
                ).first()
            )

        next_service_date = request.input(
            "next_service_date"
        )

        next_service_mileage = request.input(
            "next_service_mileage"
        )

        interval_days = request.input(
            "interval_days"
        )

        reminder_enabled = request.input(
            "reminder_enabled"
        )

        if not next_service_date:
            return {
                "success": False,
                "message": (
                    "next_service_date is required."
                ),
            }, 400

        if interval_days in (None, ""):
            return {
                "success": False,
                "message": (
                    "interval_days is required."
                ),
            }, 400

        try:
            next_service_date = date.fromisoformat(
                next_service_date
            )
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid next_service_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        if next_service_mileage == "":
            next_service_mileage = None

        elif next_service_mileage is not None:

            try:
                next_service_mileage = float(
                    next_service_mileage
                )
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": (
                        "Invalid next_service_mileage."
                    ),
                }, 400

            if next_service_mileage < 0:
                return {
                    "success": False,
                    "message": (
                        "next_service_mileage cannot "
                        "be negative."
                    ),
                }, 400

        try:
            interval_days = int(
                interval_days
            )
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid interval_days.",
            }, 400

        if interval_days <= 0:
            return {
                "success": False,
                "message": (
                    "interval_days must be greater than 0."
                ),
            }, 400

        if reminder_enabled in (
            None,
            ""
        ):
            reminder_enabled = True

        # -----------------------------------------------------
        # Reuse existing schedule
        # -----------------------------------------------------

        if existing_schedule:

            existing_schedule.next_service_date = (
                next_service_date
            )

            existing_schedule.next_service_mileage = (
                next_service_mileage
            )

            existing_schedule.interval_days = (
                interval_days
            )

            existing_schedule.reminder_enabled = (
                reminder_enabled
            )

            existing_schedule.save()

            return {
                "success": True,
                "message": (
                    "Maintenance schedule updated "
                    "successfully."
                ),
                "data": self.schedule_to_dict(
                    existing_schedule
                ),
            }

        # -----------------------------------------------------
        # Create new schedule
        # -----------------------------------------------------

        schedule = MaintenanceSchedule.create({
            "appliance_id": (
                appliance_id
                if appliance_id
                else None
            ),
            "vehicle_id": (
                vehicle_id
                if vehicle_id
                else None
            ),
            "next_service_date": next_service_date,
            "next_service_mileage": (
                next_service_mileage
            ),
            "interval_days": interval_days,
            "reminder_enabled": reminder_enabled,
        })

        return {
            "success": True,
            "message": (
                "Maintenance schedule created successfully."
            ),
            "data": self.schedule_to_dict(schedule),
        }, 201

    # =========================================================
    # DUE
    # =========================================================

    def due(self, request: Request):
        """
        Return schedules that are due/overdue.

        Appliance:
            due when next_service_date has arrived.

        Vehicle:
            due when either the date OR mileage threshold
            has been reached.
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        owned_appliance_ids = (
            self.owned_appliance_ids(
                customer
            )
        )

        owned_vehicle_ids = (
            self.owned_vehicle_ids(
                customer
            )
        )

        vehicles_by_id = {
            vehicle.id: vehicle
            for vehicle in Vehicle.where(
                "customer_id",
                customer.id
            ).get()
        }

        all_schedules = (
            MaintenanceSchedule.all()
        )

        today = date.today()

        due_schedules = []

        for schedule in all_schedules:

            owns_appliance = (
                schedule.appliance_id
                in owned_appliance_ids
            )

            owns_vehicle = (
                schedule.vehicle_id
                in owned_vehicle_ids
            )

            if not owns_appliance and not owns_vehicle:
                continue

            is_due = False

            next_service_date = (
                schedule.next_service_date
            )

            if isinstance(
                next_service_date,
                str
            ):
                try:
                    next_service_date = (
                        date.fromisoformat(
                            next_service_date
                        )
                    )
                except (
                    ValueError,
                    TypeError
                ):
                    next_service_date = None

            if (
                next_service_date
                and next_service_date <= today
            ):
                is_due = True

            if (
                owns_vehicle
                and schedule.next_service_mileage
                is not None
            ):
                vehicle = vehicles_by_id.get(
                    schedule.vehicle_id
                )

                if (
                    vehicle
                    and vehicle.current_mileage
                    is not None
                    and vehicle.current_mileage
                    >= schedule.next_service_mileage
                ):
                    is_due = True

            if is_due:
                due_schedules.append(
                    self.schedule_to_dict(
                        schedule
                    )
                )

        return {
            "success": True,
            "data": due_schedules,
        }

    # =========================================================
    # UPDATE
    # =========================================================

    def update(self, request: Request):
        """Update an existing customer-owned schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(
            schedule_id
        )

        if not schedule:
            return {
                "success": False,
                "message": (
                    "Maintenance schedule not found."
                ),
            }, 404

        if not self.customer_owns_schedule(
            request,
            schedule
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this maintenance schedule."
                ),
            }, 403

        next_service_date = request.input(
            "next_service_date",
            schedule.next_service_date
        )

        if isinstance(
            next_service_date,
            str
        ):
            try:
                next_service_date = (
                    date.fromisoformat(
                        next_service_date
                    )
                )
            except (
                ValueError,
                TypeError
            ):
                return {
                    "success": False,
                    "message": (
                        "Invalid next_service_date format. "
                        "Use YYYY-MM-DD."
                    ),
                }, 400

        next_service_mileage = request.input(
            "next_service_mileage",
            schedule.next_service_mileage
        )

        if next_service_mileage == "":
            next_service_mileage = None

        elif next_service_mileage is not None:

            try:
                next_service_mileage = float(
                    next_service_mileage
                )
            except (
                ValueError,
                TypeError
            ):
                return {
                    "success": False,
                    "message": (
                        "Invalid next_service_mileage."
                    ),
                }, 400

        interval_days = request.input(
            "interval_days",
            schedule.interval_days
        )

        try:
            interval_days = int(
                interval_days
            )
        except (
            ValueError,
            TypeError
        ):
            return {
                "success": False,
                "message": (
                    "Invalid interval_days."
                ),
            }, 400

        if interval_days <= 0:
            return {
                "success": False,
                "message": (
                    "interval_days must be greater than 0."
                ),
            }, 400

        reminder_enabled = request.input(
            "reminder_enabled",
            schedule.reminder_enabled
        )

        schedule.next_service_date = (
            next_service_date
        )

        schedule.next_service_mileage = (
            next_service_mileage
        )

        schedule.interval_days = (
            interval_days
        )

        schedule.reminder_enabled = (
            reminder_enabled
        )

        schedule.save()

        return {
            "success": True,
            "message": (
                "Maintenance schedule updated "
                "successfully."
            ),
            "data": self.schedule_to_dict(
                schedule
            ),
        }

    # =========================================================
    # DELETE
    # =========================================================

    def destroy(self, request: Request):
        """Delete a customer-owned schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(
            schedule_id
        )

        if not schedule:
            return {
                "success": False,
                "message": (
                    "Maintenance schedule not found."
                ),
            }, 404

        if not self.customer_owns_schedule(
            request,
            schedule
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this maintenance schedule."
                ),
            }, 403

        schedule.delete()

        return {
            "success": True,
            "message": (
                "Maintenance schedule deleted successfully."
            ),
        }