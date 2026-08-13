"""Appliance Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Appliance import Appliance


class ApplianceController(Controller):

    def index(self):
        """Return all appliances."""
        appliances = Appliance.all()

        return {
            "success": True,
            "data": list(appliances),
        }

    def show(self, request: Request):
        """Return one appliance by ID."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found."
            }, 404

        return {
            "success": True,
            "data": appliance,
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
            "data": appliance,
        }, 201

    def update(self, request: Request):
        """Update an existing appliance."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found."
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
            "data": appliance,
        }

    def destroy(self, request: Request):
        """Delete an appliance."""
        appliance_id = request.param("id")

        appliance = Appliance.find(appliance_id)

        if not appliance:
            return {
                "success": False,
                "message": "Appliance not found."
            }, 404

        appliance.delete()

        return {
            "success": True,
            "message": "Appliance deleted successfully.",
        }