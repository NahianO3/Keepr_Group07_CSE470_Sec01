"""Service Provider Controller.

Module 3 - Feature 1:
    Customers can search and browse verified service providers
    using service category, keywords, and location, with filters
    such as ratings, pricing, availability, service area, and
    completed service count.

Module 3 - Feature 4:
    Service providers can manage their professional profiles,
    expertise, service categories, pricing, availability
    schedules, service locations, and offered services.

This controller lets a logged-in service provider maintain the
profile fields that customers search and filter against (service
category, service area, bio, pricing, availability), as well as
the additional professional-profile fields covered by Feature 4
(expertise and a human-readable availability schedule). The list
of offered services is managed separately in ServiceController,
but is included here (read-only) so a provider's profile shows
everything in one place.
"""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.User import User
from app.models.Service import Service


class ServiceProviderController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def provider_to_dict(self, provider):
        """Convert a service provider user to public, JSON-safe data."""

        services = Service.where(
            "service_provider_id",
            provider.id
        ).get()

        return {
            "id": provider.id,
            "full_name": provider.full_name,
            "email": provider.email,
            "phone": provider.phone,
            "address": provider.address,
            "service_category": provider.service_category,
            "service_area": provider.service_area,
            "expertise": provider.expertise,
            "bio": provider.bio,
            "hourly_rate": provider.hourly_rate,
            "availability_schedule": (
                provider.availability_schedule
            ),
            "rating": provider.rating,
            "rating_count": provider.rating_count,
            "completed_service_count": (
                provider.completed_service_count
            ),
            "is_available": bool(provider.is_available),
            "account_status": provider.account_status,
            "services": [
                {
                    "id": service.id,
                    "service_name": service.service_name,
                    "category": service.category,
                    "description": service.description,
                    "estimated_price": (
                        service.estimated_price
                    ),
                    "estimated_duration_hours": (
                        service.estimated_duration_hours
                    ),
                }
                for service in services
            ],
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

    def _to_bool(self, value):
        if isinstance(value, bool):
            return value

        return str(value).strip().lower() in [
            "true",
            "1",
            "yes",
        ]

    # =========================================================
    # CUSTOMER - SEARCH / BROWSE (Module 3, Feature 1)
    # =========================================================

    def index(self, request: Request):
        """
        Search and browse verified (approved/active) service
        providers.

        Supported query params:
            category      -> matches service_category
            keyword       -> matches full_name, bio, service_category
            location      -> matches service_area, address
            service_area  -> matches service_area
            min_rating    -> rating >= value
            min_price     -> hourly_rate >= value
            max_price     -> hourly_rate <= value
            available     -> "true" / "false"
            min_completed -> completed_service_count >= value
            sort_by       -> rating | price_low | price_high | completed
        """

        providers = User.where(
            "role", "service_provider"
        ).where(
            "account_status", "active"
        ).get()

        category = request.input("category")
        keyword = request.input("keyword")
        location = request.input("location")
        service_area = request.input("service_area")

        min_rating = self._to_float(
            request.input("min_rating")
        )

        min_price = self._to_float(
            request.input("min_price")
        )

        max_price = self._to_float(
            request.input("max_price")
        )

        min_completed = self._to_int(
            request.input("min_completed")
        )

        available = request.input("available")

        results = []

        for provider in providers:

            if category:
                if (
                    not provider.service_category
                    or category.lower()
                    not in provider.service_category.lower()
                ):
                    continue

            if service_area:
                if (
                    not provider.service_area
                    or service_area.lower()
                    not in provider.service_area.lower()
                ):
                    continue

            if location:
                haystack = " ".join([
                    provider.service_area or "",
                    provider.address or "",
                ]).lower()

                if location.lower() not in haystack:
                    continue

            if keyword:
                haystack = " ".join([
                    provider.full_name or "",
                    provider.bio or "",
                    provider.service_category or "",
                ]).lower()

                if keyword.lower() not in haystack:
                    continue

            if min_rating is not None:
                if (provider.rating or 0) < min_rating:
                    continue

            if min_price is not None:
                if (
                    provider.hourly_rate is None
                    or provider.hourly_rate < min_price
                ):
                    continue

            if max_price is not None:
                if (
                    provider.hourly_rate is None
                    or provider.hourly_rate > max_price
                ):
                    continue

            if min_completed is not None:
                if (
                    (provider.completed_service_count or 0)
                    < min_completed
                ):
                    continue

            if available not in (None, ""):
                if bool(provider.is_available) != self._to_bool(
                    available
                ):
                    continue

            results.append(provider)

        sort_by = request.input("sort_by")

        if sort_by == "rating":
            results.sort(
                key=lambda p: (p.rating or 0),
                reverse=True,
            )

        elif sort_by == "price_low":
            results.sort(
                key=lambda p: (
                    p.hourly_rate
                    if p.hourly_rate is not None
                    else float("inf")
                )
            )

        elif sort_by == "price_high":
            results.sort(
                key=lambda p: (p.hourly_rate or 0),
                reverse=True,
            )

        elif sort_by == "completed":
            results.sort(
                key=lambda p: (
                    p.completed_service_count or 0
                ),
                reverse=True,
            )

        return {
            "success": True,
            "data": [
                self.provider_to_dict(provider)
                for provider in results
            ],
        }

    def show(self, request: Request):
        """Get a single verified service provider's public profile."""

        provider = User.find(request.param("id"))

        if not provider or provider.role != "service_provider":
            return {
                "success": False,
                "message": "Service provider not found.",
            }, 404

        if provider.account_status != "active":
            return {
                "success": False,
                "message": "Service provider not found.",
            }, 404

        return {
            "success": True,
            "data": self.provider_to_dict(provider),
        }

    # =========================================================
    # SERVICE PROVIDER - MANAGE OWN PROFILE
    # =========================================================

    def my_profile(self, request: Request):
        """Return the logged-in provider's own profile."""

        provider = request.user()

        if not provider:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        return {
            "success": True,
            "data": self.provider_to_dict(provider),
        }

    def update_profile(self, request: Request):
        """
        Update the logged-in provider's searchable profile
        fields (category, area, bio, pricing, availability).

        Rating, rating_count and completed_service_count are
        system-managed and cannot be edited directly here.
        """

        provider = request.user()

        if not provider:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        service_category = request.input(
            "service_category", provider.service_category
        )

        service_area = request.input(
            "service_area", provider.service_area
        )

        expertise = request.input(
            "expertise", provider.expertise
        )

        bio = request.input("bio", provider.bio)

        availability_schedule = request.input(
            "availability_schedule",
            provider.availability_schedule
        )

        hourly_rate = request.input(
            "hourly_rate", provider.hourly_rate
        )

        is_available = request.input(
            "is_available", provider.is_available
        )

        if hourly_rate == "":
            hourly_rate = None

        elif hourly_rate is not None:
            hourly_rate = self._to_float(hourly_rate)

            if hourly_rate is None or hourly_rate < 0:
                return {
                    "success": False,
                    "message": "Invalid hourly_rate.",
                }, 400

        provider.service_category = service_category
        provider.service_area = service_area
        provider.expertise = expertise
        provider.bio = bio
        provider.availability_schedule = availability_schedule
        provider.hourly_rate = hourly_rate
        provider.is_available = self._to_bool(is_available)

        provider.save()

        return {
            "success": True,
            "message": "Provider profile updated successfully.",
            "data": self.provider_to_dict(provider),
        }