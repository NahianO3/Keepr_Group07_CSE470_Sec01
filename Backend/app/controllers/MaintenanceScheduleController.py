"""Maintenance Schedule Controller."""

from datetime import date

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance


class MaintenanceScheduleController(Controller):

    def schedule_to_dict(self, schedule):
        """Convert a maintenance schedule model to JSON-safe data."""

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

    def index(self, request: Request):
        """Return maintenance schedules."""

        appliance_id = request.input("appliance_id")

        if appliance_id:
            schedules = MaintenanceSchedule.where(
                "appliance_id",
                appliance_id
            ).get()
        else:
            schedules = MaintenanceSchedule.all()

        data = [
            self.schedule_to_dict(schedule)
            for schedule in schedules
        ]

        return {
            "success": True,
            "data": data,
        }

    def show(self, request: Request):
        """Return one maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(schedule_id)

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
            }, 404

        return {
            "success": True,
            "data": self.schedule_to_dict(schedule),
        }

    def store(self, request: Request):
        """Create a maintenance schedule."""

        appliance_id = request.input("appliance_id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        next_service_date = request.input("next_service_date")
        next_service_mileage = request.input("next_service_mileage")
        interval_days = request.input("interval_days")
        reminder_enabled = request.input("reminder_enabled")

        if not next_service_date or not interval_days:
            return {
                "success": False,
                "message": (
                    "next_service_date and interval_days "
                    "are required."
                ),
            }, 400

        try:
            next_service_date = date.fromisoformat(next_service_date)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid next_service_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        # Empty string cannot be stored in a PostgreSQL
        # double precision column. Treat it as NULL.
        if next_service_mileage == "":
            next_service_mileage = None
        elif next_service_mileage is not None:
            try:
                next_service_mileage = float(next_service_mileage)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid next_service_mileage.",
                }, 400

        try:
            interval_days = int(interval_days)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid interval_days.",
            }, 400

        schedule = MaintenanceSchedule.create({
            "appliance_id": appliance_id,
            "next_service_date": next_service_date,
            "next_service_mileage": next_service_mileage,
            "interval_days": interval_days,
            "reminder_enabled": reminder_enabled,
        })

        return {
            "success": True,
            "message": "Maintenance schedule created successfully.",
            "data": self.schedule_to_dict(schedule),
        }, 201

    def update(self, request: Request):
        """Update a maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(schedule_id)

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
            }, 404

        next_service_date = request.input(
            "next_service_date",
            schedule.next_service_date
        )

        if isinstance(next_service_date, str):
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

        next_service_mileage = request.input(
            "next_service_mileage",
            schedule.next_service_mileage
        )

        # Treat an empty mileage field as NULL.
        if next_service_mileage == "":
            next_service_mileage = None
        elif next_service_mileage is not None:
            try:
                next_service_mileage = float(next_service_mileage)
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid next_service_mileage.",
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

        schedule.next_service_date = next_service_date
        schedule.next_service_mileage = next_service_mileage
        schedule.interval_days = interval_days

        schedule.reminder_enabled = request.input(
            "reminder_enabled",
            schedule.reminder_enabled
        )

        schedule.save()

        return {
            "success": True,
            "message": "Maintenance schedule updated successfully.",
            "data": self.schedule_to_dict(schedule),
        }

    def destroy(self, request: Request):
        """Delete a maintenance schedule."""

        schedule_id = request.param("id")

        schedule = MaintenanceSchedule.find(schedule_id)

        if not schedule:
            return {
                "success": False,
                "message": "Maintenance schedule not found.",
            }, 404

        schedule.delete()

        return {
            "success": True,
            "message": "Maintenance schedule deleted successfully.",
        }