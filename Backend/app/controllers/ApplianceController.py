"""Appliance Controller."""

from datetime import date, timedelta

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Appliance import Appliance
from app.models.MaintenanceSchedule import MaintenanceSchedule


class ApplianceController(Controller):

    def appliance_to_dict(self, appliance):
        """Convert an appliance model to JSON-safe data."""

        purchase_date = appliance.purchase_date
        if purchase_date:
            purchase_date = (
                purchase_date.isoformat()
                if hasattr(purchase_date, "isoformat")
                else str(purchase_date)
            )

        warranty_expiry = appliance.warranty_expiry
        if warranty_expiry:
            warranty_expiry = (
                warranty_expiry.isoformat()
                if hasattr(warranty_expiry, "isoformat")
                else str(warranty_expiry)
            )

        created_at = appliance.created_at
        if created_at:
            created_at = (
                created_at.isoformat()
                if hasattr(created_at, "isoformat")
                else str(created_at)
            )

        updated_at = appliance.updated_at
        if updated_at:
            updated_at = (
                updated_at.isoformat()
                if hasattr(updated_at, "isoformat")
                else str(updated_at)
            )

        return {
            "id": appliance.id,
            "customer_id": appliance.customer_id,
            "category": appliance.category,
            "name": appliance.name,
            "purchase_date": purchase_date,
            "warranty_expiry": warranty_expiry,
            "maintenance_interval": appliance.maintenance_interval,
            "condition": appliance.condition,
            "created_at": created_at,
            "updated_at": updated_at,
        }

    def customer_owns_appliance(self, request, appliance):
        """Check whether the logged-in customer owns the appliance."""

        customer = request.user()

        if not customer:
            return False

        return appliance.customer_id == customer.id

    def _get_date(self, value):
        """Convert a database/string date to a Python date."""

        if isinstance(value, date):
            return value

        if isinstance(value, str):
            return date.fromisoformat(value)

        return None

    def _calculate_next_service_date(
        self,
        purchase_date,
        interval_days
    ):
        """
        Calculate the next upcoming recurring service date.

        Starts from the appliance purchase date and keeps advancing
        by the maintenance interval until the date is today or later.
        """

        purchase_date = self._get_date(purchase_date)

        if not purchase_date:
            return None

        next_service_date = (
            purchase_date + timedelta(days=interval_days)
        )

        today = date.today()

        while next_service_date < today:
            next_service_date += timedelta(days=interval_days)

        return next_service_date

    def _sync_maintenance_schedule(self, appliance):
        """
        Create or update the appliance's recurring maintenance schedule.
        """

        interval_days = appliance.maintenance_interval

        if interval_days is None:
            return None

        try:
            interval_days = int(interval_days)
        except (ValueError, TypeError):
            return None

        if interval_days <= 0:
            return None

        next_service_date = self._calculate_next_service_date(
            appliance.purchase_date,
            interval_days
        )

        if not next_service_date:
            return None

        schedule = MaintenanceSchedule.where(
            "appliance_id",
            appliance.id
        ).first()

        if schedule:
            schedule.next_service_date = next_service_date
            schedule.interval_days = interval_days
            schedule.reminder_enabled = True
            schedule.save()
        else:
            schedule = MaintenanceSchedule.create({
                "appliance_id": appliance.id,
                "next_service_date": next_service_date,
                "next_service_mileage": None,
                "interval_days": interval_days,
                "reminder_enabled": True,
            })

        return schedule

    def index(self, request: Request):
        """Return appliances belonging to the logged-in customer."""

        customer = request.user()

        appliances = Appliance.where(
            "customer_id",
            customer.id
        ).get()

        data = [
            self.appliance_to_dict(appliance)
            for appliance in appliances
        ]

        return {
            "success": True,
            "data": data,
        }

    def warranty_due(self, request: Request):
        """Return customer's appliances with warranty expiring within 30 days."""

        customer = request.user()

        today = date.today()
        reminder_limit = today + timedelta(days=30)

        appliances = Appliance.where(
            "customer_id",
            customer.id
        ).get()

        due_appliances = []

        for appliance in appliances:
            warranty_expiry = appliance.warranty_expiry

            if not warranty_expiry:
                continue

            warranty_expiry = self._get_date(warranty_expiry)

            if warranty_expiry and warranty_expiry <= reminder_limit:
                due_appliances.append(
                    self.appliance_to_dict(appliance)
                )

        return {
            "success": True,
            "data": due_appliances,
        }

    def show(self, request: Request):
        """Return one appliance belonging to the logged-in customer."""

        appliance_id = request.param("id")

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

        return {
            "success": True,
            "data": self.appliance_to_dict(appliance),
        }

    def store(self, request: Request):
        """Create a new appliance for the logged-in customer."""

        customer = request.user()

        maintenance_interval = request.input(
            "maintenance_interval"
        )

        try:
            maintenance_interval = int(maintenance_interval)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid maintenance interval.",
            }, 400

        if maintenance_interval <= 0:
            return {
                "success": False,
                "message": (
                    "Maintenance interval must be greater than 0."
                ),
            }, 400

        purchase_date = request.input("purchase_date")

        try:
            purchase_date = date.fromisoformat(purchase_date)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid purchase_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        data = {
            "customer_id": customer.id,
            "category": request.input("category"),
            "name": request.input("name"),
            "purchase_date": purchase_date,
            "warranty_expiry": request.input("warranty_expiry"),
            "maintenance_interval": maintenance_interval,
            "condition": request.input("condition"),
        }

        appliance = Appliance.create(data)

        # Feature 3:
        # Automatically generate the first recurring schedule.
        schedule = self._sync_maintenance_schedule(appliance)

        return {
            "success": True,
            "message": "Appliance created successfully.",
            "data": self.appliance_to_dict(appliance),
            "schedule": (
                {
                    "id": schedule.id,
                    "next_service_date": (
                        schedule.next_service_date.isoformat()
                        if hasattr(
                            schedule.next_service_date,
                            "isoformat"
                        )
                        else str(schedule.next_service_date)
                    ),
                    "interval_days": schedule.interval_days,
                    "reminder_enabled": schedule.reminder_enabled,
                }
                if schedule
                else None
            ),
        }, 201

    def update(self, request: Request):
        """Update an appliance belonging to the logged-in customer."""

        appliance_id = request.param("id")

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
                    "You do not have permission to update "
                    "this appliance."
                ),
            }, 403

        maintenance_interval = request.input(
            "maintenance_interval",
            appliance.maintenance_interval
        )

        try:
            maintenance_interval = int(maintenance_interval)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid maintenance interval.",
            }, 400

        if maintenance_interval <= 0:
            return {
                "success": False,
                "message": (
                    "Maintenance interval must be greater than 0."
                ),
            }, 400

        appliance.category = request.input(
            "category",
            appliance.category
        )

        appliance.name = request.input(
            "name",
            appliance.name
        )

        purchase_date = request.input(
            "purchase_date",
            appliance.purchase_date
        )

        try:
            purchase_date = self._get_date(purchase_date)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid purchase_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        appliance.purchase_date = purchase_date

        appliance.warranty_expiry = request.input(
            "warranty_expiry",
            appliance.warranty_expiry
        )

        appliance.maintenance_interval = maintenance_interval

        appliance.condition = request.input(
            "condition",
            appliance.condition
        )

        appliance.save()

        # Keep the recurring schedule synchronized
        # with the updated appliance interval.
        self._sync_maintenance_schedule(appliance)

        return {
            "success": True,
            "message": "Appliance updated successfully.",
            "data": self.appliance_to_dict(appliance),
        }

    def destroy(self, request: Request):
        """Delete an appliance belonging to the logged-in customer."""

        appliance_id = request.param("id")

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
                    "You do not have permission to delete "
                    "this appliance."
                ),
            }, 403

        appliance.delete()

        return {
            "success": True,
            "message": "Appliance deleted successfully.",
        }