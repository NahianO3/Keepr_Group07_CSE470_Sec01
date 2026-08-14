"""Appliance Controller."""

from masonite.controllers import Controller
from masonite.request import Request
from datetime import date, timedelta

from app.models.Appliance import Appliance


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

    def index(self, request: Request):
        """Return all appliances."""
        appliances = Appliance.all()

        data = [
            self.appliance_to_dict(appliance)
            for appliance in appliances
        ]

        return {
            "success": True,
            "data": data,
        }


    def warranty_due(self):
        """Return appliances with warranty expiring within 30 days."""

        today = date.today()
        reminder_limit = today + timedelta(days=30)

        appliances = Appliance.all()

        due_appliances = []

        for appliance in appliances:
            warranty_expiry = appliance.warranty_expiry

            if not warranty_expiry:
                continue

            if isinstance(warranty_expiry, str):
                warranty_expiry = date.fromisoformat(warranty_expiry)

            if warranty_expiry <= reminder_limit:
                due_appliances.append(
                    self.appliance_to_dict(appliance)
                )

        return {
            "success": True,
            "data": due_appliances,
        }
    
    def show(self, request: Request):
        """Return one appliance by ID."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        return {
            "success": True,
            "data": self.appliance_to_dict(appliance),
        }

    def store(self, request: Request):
        """Create a new appliance."""
        data = {
            "customer_id": request.input("customer_id"),
            "category": request.input("category"),
            "name": request.input("name"),
            "purchase_date": request.input("purchase_date"),
            "warranty_expiry": request.input("warranty_expiry"),
            "maintenance_interval": request.input("maintenance_interval"),
            "condition": request.input("condition"),
        }

        appliance = Appliance.create(data)

        return {
            "success": True,
            "message": "Appliance created successfully.",
            "data": self.appliance_to_dict(appliance),
        }, 201

    def update(self, request: Request):
        """Update an existing appliance."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        appliance.customer_id = request.input(
            "customer_id",
            appliance.customer_id
        )
        appliance.category = request.input(
            "category",
            appliance.category
        )
        appliance.name = request.input(
            "name",
            appliance.name
        )
        appliance.purchase_date = request.input(
            "purchase_date",
            appliance.purchase_date
        )
        appliance.warranty_expiry = request.input(
            "warranty_expiry",
            appliance.warranty_expiry
        )
        appliance.maintenance_interval = request.input(
            "maintenance_interval",
            appliance.maintenance_interval
        )
        appliance.condition = request.input(
            "condition",
            appliance.condition
        )

        appliance.save()

        return {
            "success": True,
            "message": "Appliance updated successfully.",
            "data": self.appliance_to_dict(appliance),
        }

    def destroy(self, request: Request):
        """Delete an appliance."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found.",
            }, 404

        appliance.delete()

        return {
            "success": True,
            "message": "Appliance deleted successfully.",
        }