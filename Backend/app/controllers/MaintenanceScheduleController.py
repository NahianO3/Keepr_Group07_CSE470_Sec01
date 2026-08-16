"""Maintenance Schedule Controller."""

from datetime import date

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance


class MaintenanceScheduleController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def schedule_to_dict(self, schedule):
        """Convert maintenance schedule to JSON-safe data."""

        next_service_date = schedule.next_service_date

        if next_service_date:
            if hasattr(next_service_date, "isoformat"):
                next_service_date = next_service_date.isoformat()
            else:
                next_service_date = str(next_service_date)

        created_at = schedule.created_at

        if created_at:
            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            else:
                created_at = str(created_at)

        updated_at = schedule.updated_at

        if updated_at:
            if hasattr(updated_at, "isoformat"):
                updated_at = updated_at.isoformat()
            else:
                updated_at = str(updated_at)

        return {
            "id": schedule.id,
            "appliance_id": schedule.appliance_id,
            "next_service_date": next_service_date,
            "next_service_mileage": schedule.next_service_mileage,
            "interval_days": schedule.interval_days,
            "reminder_enabled": schedule.reminder_enabled,
            "created_at": created_at,
            "updated_at": updated_at,
        }

    def customer_owns_appliance(self, request, appliance):
        """Check whether the logged-in customer owns appliance."""

        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id

    def customer_owns_schedule(self, request, schedule):
        """Check whether the logged-in customer owns schedule."""

        appliance = Appliance.find(schedule.appliance_id)

        if not appliance:
            return False

        return self.customer_owns_appliance(
            request,
            appliance
        )

    # =========================================================
    # GET ALL
    # =========================================================

    def index(self, request: Request):
        """Return maintenance schedules for logged-in customer."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        appliance_id = request.input("appliance_id")

        if appliance_id:

            appliance = Appliance.find(appliance_id)

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
                        "You do not have permission to access "
                        "this appliance."
                    ),
                }, 403

            schedules = MaintenanceSchedule.where(
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

            all_schedules = MaintenanceSchedule.all()

            schedules = [
                schedule
                for schedule in all_schedules
                if schedule.appliance_id in owned_appliance_ids
            ]

        return {
            "success": True,
            "data": [
                self.schedule_to_dict(schedule)
                for schedule in schedules
            ],
        }

    # =========================================================
    # GET ONE
    # =========================================================

    def show(self, request: Request):
        """Return one customer-owned maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(schedule_id)

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
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
    # CREATE / SYNC
    # =========================================================

    def store(self, request: Request):
        """
        Create or synchronize an appliance maintenance schedule.

        If the appliance already has an automatically generated
        schedule, update that schedule instead of creating a
        duplicate one.
        """

        appliance_id = request.input("appliance_id")

        appliance = Appliance.find(appliance_id)

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
                    "You do not have permission to manage "
                    "this appliance's schedule."
                ),
            }, 403

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

        # -----------------------------------------------------
        # Required fields
        # -----------------------------------------------------

        if not next_service_date:
            return {
                "success": False,
                "message": "next_service_date is required.",
            }, 400

        if interval_days is None or interval_days == "":
            return {
                "success": False,
                "message": "interval_days is required.",
            }, 400

        # -----------------------------------------------------
        # Date validation
        # -----------------------------------------------------

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

        # -----------------------------------------------------
        # Mileage validation
        # -----------------------------------------------------

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
                    "message": "Invalid next_service_mileage.",
                }, 400

        # -----------------------------------------------------
        # Interval validation
        # -----------------------------------------------------

        try:
            interval_days = int(interval_days)
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

        # -----------------------------------------------------
        # Reminder
        # -----------------------------------------------------

        if reminder_enabled is None or reminder_enabled == "":
            reminder_enabled = True

        # -----------------------------------------------------
        # IMPORTANT:
        # Reuse existing schedule if one exists.
        # -----------------------------------------------------

        schedule = MaintenanceSchedule.where(
            "appliance_id",
            appliance_id
        ).first()

        if schedule:

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

        # -----------------------------------------------------
        # No existing schedule → create one.
        # -----------------------------------------------------

        schedule = MaintenanceSchedule.create({
            "appliance_id": appliance_id,
            "next_service_date": next_service_date,
            "next_service_mileage": next_service_mileage,
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
    # DUE / OVERDUE
    # =========================================================

    def due(self, request: Request):
        """Return schedules that are due or overdue."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        customer_appliances = Appliance.where(
            "customer_id",
            customer.id
        ).get()

        owned_appliance_ids = {
            appliance.id
            for appliance in customer_appliances
        }

        all_schedules = MaintenanceSchedule.all()

        today = date.today()

        due_schedules = []

        for schedule in all_schedules:

            if schedule.appliance_id not in owned_appliance_ids:
                continue

            next_service_date = (
                schedule.next_service_date
            )

            if isinstance(next_service_date, str):

                try:
                    next_service_date = (
                        date.fromisoformat(
                            next_service_date
                        )
                    )

                except (ValueError, TypeError):
                    continue

            if (
                next_service_date
                and next_service_date <= today
            ):
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
        """Update a customer-owned maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(
            schedule_id
        )

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
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

        if isinstance(next_service_date, str):

            try:
                next_service_date = (
                    date.fromisoformat(
                        next_service_date
                    )
                )
            except (ValueError, TypeError):
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
            except (ValueError, TypeError):
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
            interval_days = int(interval_days)
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

        schedule.interval_days = interval_days

        schedule.reminder_enabled = (
            reminder_enabled
        )

        schedule.save()

        return {
            "success": True,
            "message": (
                "Maintenance schedule updated successfully."
            ),
            "data": self.schedule_to_dict(
                schedule
            ),
        }

    # =========================================================
    # DELETE
    # =========================================================

    def destroy(self, request: Request):
        """Delete a customer-owned maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(
            schedule_id
        )

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
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