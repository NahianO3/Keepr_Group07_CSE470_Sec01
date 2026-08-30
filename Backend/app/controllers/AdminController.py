"""Admin Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.User import User
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Review import Review
from app.models.Report import Report


class AdminController(Controller):

    def users(self, request: Request):
        users = User.all()

        data = []

        for user in users:
            data.append({
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "account_status": user.account_status,
            })

        return {
            "success": True,
            "data": data,
        }

    def update_user_status(self, request: Request):
        user = User.find(request.param("id"))

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        status = request.input("account_status")

        if status not in ["active", "suspended"]:
            return {
                "success": False,
                "message": "Invalid account status.",
            }, 400

        user.account_status = status
        user.save()

        return {
            "success": True,
            "message": "User status updated successfully.",
        }

    def approve_provider(self, request: Request):
        user = User.find(request.param("id"))

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        if user.role != "service_provider":
            return {
                "success": False,
                "message": "User is not a service provider.",
            }, 400

        if user.account_status != "pending":
            return {
                "success": False,
                "message": (
                    "Only pending service providers can be approved."
                ),
            }, 400

        user.account_status = "active"
        user.save()

        return {
            "success": True,
            "message": "Service provider approved successfully.",
        }

    def maintenance_records(self, request: Request):
        records = MaintenanceRecord.all()

        return {
            "success": True,
            "data": [
                {
                    "id": record.id,
                    "appliance_id": record.appliance_id,
                    "service_provider_id": record.service_provider_id,
                    "maintenance_date": (
                        record.maintenance_date.isoformat()
                        if hasattr(
                            record.maintenance_date,
                            "isoformat"
                        )
                        else str(record.maintenance_date)
                    ),
                    "maintenance_type": record.maintenance_type,
                    "work_performed": record.work_performed,
                    "cost": record.cost,
                    "status": record.status,
                }
                for record in records
            ],
        }

    def reviews(self, request: Request):
        reviews = Review.all()

        data = []

        for review in reviews:
            customer = User.find(review.customer_id)
            provider = User.find(
                review.service_provider_id
            )

            data.append({
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
                "service_provider_name": (
                    provider.full_name
                    if provider
                    else "Service Provider"
                ),
                "rating": review.rating,
                "review": review.review,
                "moderation_status": (
                    review.moderation_status
                ),
                "created_at": (
                    review.created_at.isoformat()
                    if review.created_at
                    else None
                ),
            })

        return {
            "success": True,
            "data": data,
        }

    def update_review_status(self, request: Request):
        review = Review.find(
            request.param("id")
        )

        if not review:
            return {
                "success": False,
                "message": "Review not found.",
            }, 404

        moderation_status = request.input(
            "moderation_status"
        )

        if moderation_status not in [
            "visible",
            "hidden",
        ]:
            return {
                "success": False,
                "message": (
                    "Invalid moderation status."
                ),
            }, 400

        review.moderation_status = (
            moderation_status
        )
        review.save()

        reviews = Review.where(
            "service_provider_id",
            review.service_provider_id
        ).where(
            "moderation_status",
            "visible"
        ).get()

        provider = User.find(
            review.service_provider_id
        )

        if provider:
            if reviews:
                total = sum(
                    float(item.rating)
                    for item in reviews
                )

                provider.rating = round(
                    total / len(reviews),
                    2
                )
                provider.rating_count = len(
                    reviews
                )

            else:
                provider.rating = 0
                provider.rating_count = 0

            provider.save()

        return {
            "success": True,
            "message": (
                "Review moderation status updated successfully."
            ),
        }

    def reports(self, request: Request):
        reports = Report.all()

        data = []

        for report in reports:
            reporter = User.find(
                report.reporter_id
            )

            provider = User.find(
                report.service_provider_id
            )

            data.append({
                "id": report.id,
                "maintenance_record_id": (
                    report.maintenance_record_id
                ),
                "reporter_id": report.reporter_id,
                "reporter_name": (
                    reporter.full_name
                    if reporter
                    else "Customer"
                ),
                "service_provider_id": (
                    report.service_provider_id
                ),
                "service_provider_name": (
                    provider.full_name
                    if provider
                    else "Service Provider"
                ),
                "reason": report.reason,
                "description": report.description,
                "status": report.status,
                "resolution_note": (
                    report.resolution_note
                ),
                "created_at": (
                    report.created_at.isoformat()
                    if report.created_at
                    else None
                ),
            })

        return {
            "success": True,
            "data": data,
        }

    def update_report_status(self, request: Request):
        report = Report.find(
            request.param("id")
        )

        if not report:
            return {
                "success": False,
                "message": "Report not found.",
            }, 404

        status = request.input("status")
        resolution_note = request.input(
            "resolution_note"
        )

        if status not in [
            "Pending",
            "Resolved",
            "Dismissed",
        ]:
            return {
                "success": False,
                "message": "Invalid report status.",
            }, 400

        report.status = status

        if resolution_note is not None:
            report.resolution_note = (
                resolution_note.strip()
                if resolution_note
                else None
            )

        report.save()

        return {
            "success": True,
            "message": (
                "Report status updated successfully."
            ),
        }