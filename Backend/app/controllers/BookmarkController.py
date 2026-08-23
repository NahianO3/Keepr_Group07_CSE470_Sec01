"""Bookmark Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Bookmark import Bookmark
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.User import User
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class BookmarkController(Controller):

    def customer_owns_record(self, request, record):
        customer = request.user()

        if not customer:
            return False

        if record.appliance_id is not None:
            appliance = Appliance.find(
                record.appliance_id
            )

            return (
                appliance is not None
                and appliance.customer_id == customer.id
            )

        if record.vehicle_id is not None:
            vehicle = Vehicle.find(
                record.vehicle_id
            )

            return (
                vehicle is not None
                and vehicle.customer_id == customer.id
            )

        return False

    def store(self, request: Request):
        """Bookmark a provider after completed service."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        provider_id = request.param("id")

        provider = User.find(provider_id)

        if not provider:
            return {
                "success": False,
                "message": "Service provider not found."
            }, 404

        if provider.role != "service_provider":
            return {
                "success": False,
                "message": "Service provider not found."
            }, 404

        if provider.account_status != "active":
            return {
                "success": False,
                "message": "Service provider not found."
            }, 404

        completed_records = MaintenanceRecord.where(
            "service_provider_id",
            provider.id
        ).where(
            "status",
            "Completed"
        ).get()

        has_completed_service = any(
            self.customer_owns_record(
                request,
                record
            )
            for record in completed_records
        )

        if not has_completed_service:
            return {
                "success": False,
                "message": (
                    "You can bookmark a service provider "
                    "after completing a service with them."
                )
            }, 403

        existing = Bookmark.where(
            "customer_id",
            customer.id
        ).where(
            "service_provider_id",
            provider.id
        ).first()

        if existing:
            return {
                "success": False,
                "message": "Provider is already bookmarked."
            }, 409

        bookmark = Bookmark.create({
            "customer_id": customer.id,
            "service_provider_id": provider.id,
        })

        return {
            "success": True,
            "message": "Service provider bookmarked.",
            "data": {
                "id": bookmark.id,
                "customer_id": bookmark.customer_id,
                "service_provider_id": (
                    bookmark.service_provider_id
                ),
            }
        }, 201

    def destroy(self, request: Request):
        """Remove a provider bookmark."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        provider_id = request.param("id")

        bookmark = Bookmark.where(
            "customer_id",
            customer.id
        ).where(
            "service_provider_id",
            provider_id
        ).first()

        if not bookmark:
            return {
                "success": False,
                "message": "Bookmark not found."
            }, 404

        bookmark.delete()

        return {
            "success": True,
            "message": "Service provider bookmark removed."
        }

    def index(self, request: Request):
        """List providers bookmarked by customer."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        bookmarks = Bookmark.where(
            "customer_id",
            customer.id
        ).get()

        data = []

        for bookmark in bookmarks:

            provider = User.find(
                bookmark.service_provider_id
            )

            if not provider:
                continue

            data.append({
                "id": bookmark.id,
                "service_provider_id": provider.id,
                "service_provider_name": (
                    provider.full_name
                ),
                "service_category": (
                    provider.service_category
                ),
                "service_area": (
                    provider.service_area
                ),
                "rating": provider.rating,
                "rating_count": provider.rating_count,
            })

        return {
            "success": True,
            "data": data
        }