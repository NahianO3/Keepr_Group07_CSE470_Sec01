"""Service Controller.

Module 3 - Feature 4:
    Service providers can manage their professional profiles,
    expertise, service categories, pricing, availability
    schedules, service locations, and offered services.

This controller covers the "offered services" part of Feature 4 -
letting a logged-in service provider list, add, update and remove
the specific services they offer (e.g. "AC Gas Refill", priced and
timed independently of their overall hourly rate).
"""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Service import Service


class ServiceController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def service_to_dict(self, service):
        """Convert a service model to JSON-safe data."""

        return {
            "id": service.id,
            "service_provider_id": service.service_provider_id,
            "service_name": service.service_name,
            "category": service.category,
            "description": service.description,
            "estimated_price": service.estimated_price,
            "estimated_duration_hours": (
                service.estimated_duration_hours
            ),
        }

    def _to_float(self, value):
        if value in (None, ""):
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _to_int(self, value):
        if value in (None, ""):
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def provider_owns_service(self, request, service):
        """Check whether the logged-in provider owns the service."""

        provider = request.user()

        if not provider:
            return False

        return service.service_provider_id == provider.id

    # =========================================================
    # SERVICE PROVIDER - MANAGE OWN OFFERED SERVICES
    # =========================================================

    def index(self, request: Request):
        """List the logged-in provider's offered services."""

        provider = request.user()

        services = Service.where(
            "service_provider_id",
            provider.id
        ).get()

        return {
            "success": True,
            "data": [
                self.service_to_dict(service)
                for service in services
            ],
        }

    def store(self, request: Request):
        """Add a new offered service (ServiceProvider.addService())."""

        provider = request.user()

        service_name = request.input("service_name")

        if not service_name:
            return {
                "success": False,
                "message": "service_name is required.",
            }, 400

        estimated_price = request.input("estimated_price")

        if estimated_price not in (None, ""):
            estimated_price = self._to_float(estimated_price)

            if estimated_price is None or estimated_price < 0:
                return {
                    "success": False,
                    "message": "Invalid estimated_price.",
                }, 400
        else:
            estimated_price = None

        estimated_duration_hours = request.input(
            "estimated_duration_hours"
        )

        if estimated_duration_hours not in (None, ""):
            estimated_duration_hours = self._to_int(
                estimated_duration_hours
            )

            if (
                estimated_duration_hours is None
                or estimated_duration_hours < 0
            ):
                return {
                    "success": False,
                    "message": (
                        "Invalid estimated_duration_hours."
                    ),
                }, 400
        else:
            estimated_duration_hours = None

        service = Service.create({
            "service_provider_id": provider.id,
            "service_name": service_name,
            "category": request.input("category"),
            "description": request.input("description"),
            "estimated_price": estimated_price,
            "estimated_duration_hours": (
                estimated_duration_hours
            ),
        })

        return {
            "success": True,
            "message": "Service added successfully.",
            "data": self.service_to_dict(service),
        }, 201

    def update(self, request: Request):
        """Update an offered service (ServiceProvider.updateService())."""

        service = Service.find(request.param("id"))

        if not service:
            return {
                "success": False,
                "message": "Service not found.",
            }, 404

        if not self.provider_owns_service(request, service):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this service."
                ),
            }, 403

        service.service_name = request.input(
            "service_name", service.service_name
        )

        service.category = request.input(
            "category", service.category
        )

        service.description = request.input(
            "description", service.description
        )

        estimated_price = request.input(
            "estimated_price", service.estimated_price
        )

        if estimated_price in (None, ""):
            service.estimated_price = None
        else:
            estimated_price = self._to_float(estimated_price)

            if estimated_price is None or estimated_price < 0:
                return {
                    "success": False,
                    "message": "Invalid estimated_price.",
                }, 400

            service.estimated_price = estimated_price

        estimated_duration_hours = request.input(
            "estimated_duration_hours",
            service.estimated_duration_hours
        )

        if estimated_duration_hours in (None, ""):
            service.estimated_duration_hours = None
        else:
            estimated_duration_hours = self._to_int(
                estimated_duration_hours
            )

            if (
                estimated_duration_hours is None
                or estimated_duration_hours < 0
            ):
                return {
                    "success": False,
                    "message": (
                        "Invalid estimated_duration_hours."
                    ),
                }, 400

            service.estimated_duration_hours = (
                estimated_duration_hours
            )

        service.save()

        return {
            "success": True,
            "message": "Service updated successfully.",
            "data": self.service_to_dict(service),
        }

    def destroy(self, request: Request):
        """Remove an offered service."""

        service = Service.find(request.param("id"))

        if not service:
            return {
                "success": False,
                "message": "Service not found.",
            }, 404

        if not self.provider_owns_service(request, service):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this service."
                ),
            }, 403

        service.delete()

        return {
            "success": True,
            "message": "Service deleted successfully.",
        }
