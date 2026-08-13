"""Maintenance Schedule Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.MaintenanceSchedule import MaintenanceSchedule
from app.models.Appliance import Appliance


class MaintenanceScheduleController(Controller):

    def schedule_to_dict(self, schedule):
        """Convert a maintenance schedule model to JSON-safe data."""
        return {
            "id": schedule.id,
            "appliance_id": schedule.appliance_id,
            "next_service_date": (
                schedule.next_service_date.isoformat()
                if schedule.next_service_date
                else None
            ),
            "next_service_mileage": schedule.next_service_mileage,
            "interval_days": schedule.interval_days,
            "reminder_enabled": schedule.reminder_enabled,
            "created_at": (
                schedule.created_at.isoformat()
                if schedule.created_at
                else None
            ),
            "updated_at": (
                schedule.updated_at.isoformat()
                if schedule.updated_at
                else None
            ),
        }

    def index(self, request: Request):
        """Return all maintenance schedules."""

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

        schedule.next_service_date = request.input(
            "next_service_date",
            schedule.next_service_date
        )

        schedule.next_service_mileage = request.input(
            "next_service_mileage",
            schedule.next_service_mileage
        )

        schedule.interval_days = request.input(
            "interval_days",
            schedule.interval_days
        )

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