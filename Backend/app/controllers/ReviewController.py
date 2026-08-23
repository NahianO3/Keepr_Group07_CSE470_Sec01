"""Review Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Review import Review
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.User import User
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class ReviewController(Controller):

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

    def provider_stats(self, provider_id):
        provider = User.find(provider_id)

        if not provider:
            return

        reviews = Review.where(
            "service_provider_id",
            provider_id
        ).get()

        count = len(reviews)

        if count == 0:
            provider.rating = 0
            provider.rating_count = 0
        else:
            total = sum(
                float(review.rating)
                for review in reviews
            )

            provider.rating = round(
                total / count,
                2
            )

            provider.rating_count = count

        provider.save()

    def review_to_dict(self, review):
        customer = User.find(
            review.customer_id
        )

        return {
            "id": review.id,
            "maintenance_record_id": (
                review.maintenance_record_id
            ),
            "customer_id": review.customer_id,
            "customer_name": (
                customer.full_name
                if customer
                else "Customer"
            ),
            "service_provider_id": (
                review.service_provider_id
            ),
            "rating": review.rating,
            "review": review.review,
            "created_at": (
                review.created_at.isoformat()
                if review.created_at
                else None
            ),
            "updated_at": (
                review.updated_at.isoformat()
                if review.updated_at
                else None
            ),
        }

    def provider_reviews(self, request: Request):
        provider = User.find(
            request.param("id")
        )

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

        reviews = Review.where(
            "service_provider_id",
            provider.id
        ).get()

        return {
            "success": True,
            "data": [
                self.review_to_dict(review)
                for review in reviews
            ]
        }

    def store(self, request: Request):
        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        record = MaintenanceRecord.find(
            request.param("id")
        )

        if not record:
            return {
                "success": False,
                "message": "Maintenance record not found."
            }, 404

        if not self.customer_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to review "
                    "this maintenance record."
                )
            }, 403

        if record.status != "Completed":
            return {
                "success": False,
                "message": (
                    "A maintenance service can only be "
                    "reviewed after completion."
                )
            }, 409

        if not record.service_provider_id:
            return {
                "success": False,
                "message": (
                    "This maintenance record has no "
                    "service provider."
                )
            }, 400

        existing = Review.where(
            "maintenance_record_id",
            record.id
        ).first()

        if existing:
            return {
                "success": False,
                "message": (
                    "This maintenance record has already "
                    "been reviewed."
                )
            }, 409

        rating = request.input("rating")
        review_text = request.input("review")

        try:
            rating = int(rating)

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "rating must be an integer from 1 to 5."
            }, 400

        if rating < 1 or rating > 5:
            return {
                "success": False,
                "message": "rating must be between 1 and 5."
            }, 400

        review = Review.create({
            "maintenance_record_id": record.id,
            "customer_id": customer.id,
            "service_provider_id": (
                record.service_provider_id
            ),
            "rating": rating,
            "review": (
                review_text.strip()
                if review_text
                else None
            ),
        })

        self.provider_stats(
            record.service_provider_id
        )

        return {
            "success": True,
            "message": "Review submitted successfully.",
            "data": self.review_to_dict(review)
        }, 201

    def update(self, request: Request):
        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        review = Review.find(
            request.param("id")
        )

        if not review:
            return {
                "success": False,
                "message": "Review not found."
            }, 404

        if review.customer_id != customer.id:
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this review."
                )
            }, 403

        rating = request.input(
            "rating",
            review.rating
        )

        review_text = request.input(
            "review",
            review.review
        )

        try:
            rating = int(rating)

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "rating must be an integer from 1 to 5."
            }, 400

        if rating < 1 or rating > 5:
            return {
                "success": False,
                "message": "rating must be between 1 and 5."
            }, 400

        review.rating = rating
        review.review = (
            review_text.strip()
            if review_text
            else None
        )

        review.save()

        self.provider_stats(
            review.service_provider_id
        )

        return {
            "success": True,
            "message": "Review updated successfully.",
            "data": self.review_to_dict(review)
        }

    def destroy(self, request: Request):
        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        review = Review.find(
            request.param("id")
        )

        if not review:
            return {
                "success": False,
                "message": "Review not found."
            }, 404

        if review.customer_id != customer.id:
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this review."
                )
            }, 403

        provider_id = review.service_provider_id

        review.delete()

        self.provider_stats(provider_id)

        return {
            "success": True,
            "message": "Review deleted successfully."
        }