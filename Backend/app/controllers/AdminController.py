"""Admin Controller."""

from masonite.controllers import Controller
from masonite.request import Request

from app.models.User import User
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Review import Review
from app.models.Report import Report


class AdminController(Controller):

    # =========================================================
    # USER MANAGEMENT
    # Module 4 - Feature 3
    # =========================================================

    def users(self, request: Request):
        users = User.all()

        data = []

        for user in users:
            data.append(
                self.user_to_dict(user)
            )

        return {
            "success": True,
            "data": data,
        }

    def user_to_dict(self, user):
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "role": user.role,
            "account_status": user.account_status,
            "service_category": getattr(
                user,
                "service_category",
                None,
            ),
            "service_area": getattr(
                user,
                "service_area",
                None,
            ),
            "expertise": getattr(
                user,
                "expertise",
                None,
            ),
            "bio": getattr(
                user,
                "bio",
                None,
            ),
            "hourly_rate": getattr(
                user,
                "hourly_rate",
                None,
            ),
            "is_available": bool(
                getattr(
                    user,
                    "is_available",
                    False,
                )
            ),
            "availability_schedule": getattr(
                user,
                "availability_schedule",
                None,
            ),
            "rating": getattr(
                user,
                "rating",
                None,
            ),
            "rating_count": getattr(
                user,
                "rating_count",
                0,
            ),
            "completed_service_count": getattr(
                user,
                "completed_service_count",
                0,
            ),
        }

    def update_user_status(self, request: Request):
        """
        Activate, suspend, or place a customer/provider account
        into pending verification status.
        """

        user = User.find(
            request.param("id")
        )

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        if user.role not in [
            "customer",
            "service_provider",
        ]:
            return {
                "success": False,
                "message": (
                    "Only customer and service-provider "
                    "accounts can be managed here."
                ),
            }, 400

        status = request.input(
            "account_status"
        )

        allowed_statuses = [
            "pending",
            "active",
            "suspended",
        ]

        if status not in allowed_statuses:
            return {
                "success": False,
                "message": (
                    "Invalid account status."
                ),
            }, 400

        # Provider approval has its own dedicated endpoint.
        # Do not allow a provider to bypass that workflow
        # by directly activating a pending provider.
        if (
            user.role == "service_provider"
            and user.account_status == "pending"
            and status == "active"
        ):
            return {
                "success": False,
                "message": (
                    "Pending service providers must be "
                    "approved through the provider approval workflow."
                ),
            }, 400

        user.account_status = status
        user.save()

        return {
            "success": True,
            "message": (
                "User account status updated successfully."
            ),
            "data": self.user_to_dict(user),
        }

    # =========================================================
    # CUSTOMER / PROVIDER VERIFICATION
    # Module 4 - Feature 3
    # =========================================================

    def verify_user(self, request: Request):
        """
        Verify a pending customer or provider account.

        For providers, the existing approval workflow should be
        used instead. This endpoint therefore handles customers
        directly and keeps provider approval separate.
        """

        user = User.find(
            request.param("id")
        )

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        if user.role not in [
            "customer",
            "service_provider",
        ]:
            return {
                "success": False,
                "message": (
                    "Only customer and service-provider "
                    "accounts can be verified."
                ),
            }, 400

        if user.account_status == "suspended":
            return {
                "success": False,
                "message": (
                    "A suspended account cannot be verified."
                ),
            }, 400

        if user.role == "service_provider":
            return {
                "success": False,
                "message": (
                    "Service providers must be verified "
                    "through the provider approval workflow."
                ),
            }, 400

        user.account_status = "active"
        user.save()

        return {
            "success": True,
            "message": "Customer account verified successfully.",
            "data": self.user_to_dict(user),
        }

    # =========================================================
    # PROFILE MANAGEMENT
    # Module 4 - Feature 3
    # =========================================================

    def update_user_profile(self, request: Request):
        """
        Allow an administrator to manage customer/provider
        profile information.
        """

        user = User.find(
            request.param("id")
        )

        if not user:
            return {
                "success": False,
                "message": "User not found.",
            }, 404

        if user.role not in [
            "customer",
            "service_provider",
        ]:
            return {
                "success": False,
                "message": (
                    "Only customer and service-provider "
                    "profiles can be managed."
                ),
            }, 400

        # Shared profile fields.
        if request.input("full_name") is not None:
            full_name = str(
                request.input("full_name")
            ).strip()

            if not full_name:
                return {
                    "success": False,
                    "message": "full_name cannot be empty.",
                }, 400

            user.full_name = full_name

        if request.input("phone") is not None:
            user.phone = (
                str(
                    request.input("phone")
                ).strip()
                or None
            )

        if request.input("address") is not None:
            user.address = (
                str(
                    request.input("address")
                ).strip()
                or None
            )

        # Provider-only profile fields.
        if user.role == "service_provider":

            provider_fields = {
                "service_category": (
                    "service_category"
                ),
                "service_area": (
                    "service_area"
                ),
                "expertise": "expertise",
                "bio": "bio",
                "availability_schedule": (
                    "availability_schedule"
                ),
            }

            for input_name, attribute in (
                provider_fields.items()
            ):
                value = request.input(input_name)

                if value is not None:
                    value = str(value).strip()

                    setattr(
                        user,
                        attribute,
                        value or None,
                    )

            hourly_rate = request.input(
                "hourly_rate"
            )

            if hourly_rate not in (
                None,
                "",
            ):
                try:
                    hourly_rate = float(
                        hourly_rate
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    return {
                        "success": False,
                        "message": (
                            "Invalid hourly_rate."
                        ),
                    }, 400

                if hourly_rate < 0:
                    return {
                        "success": False,
                        "message": (
                            "hourly_rate cannot be negative."
                        ),
                    }, 400

                user.hourly_rate = hourly_rate

            is_available = request.input(
                "is_available"
            )

            if is_available is not None:
                if isinstance(
                    is_available,
                    bool,
                ):
                    user.is_available = (
                        is_available
                    )
                else:
                    user.is_available = (
                        str(
                            is_available
                        ).strip().lower()
                        in [
                            "true",
                            "1",
                            "yes",
                        ]
                    )

        user.save()

        return {
            "success": True,
            "message": (
                "User profile updated successfully."
            ),
            "data": self.user_to_dict(user),
        }

    # =========================================================
    # PROVIDER APPROVAL
    # Module 4 - Feature 1
    # =========================================================

    def approve_provider(self, request: Request):
        user = User.find(
            request.param("id")
        )

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
                    "Only pending service providers "
                    "can be approved."
                ),
            }, 400

        user.account_status = "active"
        user.save()

        return {
            "success": True,
            "message": (
                "Service provider approved successfully."
            ),
        }

    # =========================================================
    # MAINTENANCE / BOOKING MANAGEMENT
    # Module 4 - Feature 4
    # =========================================================

    def maintenance_records(self, request: Request):
        records = MaintenanceRecord.all()

        return {
            "success": True,
            "data": [
                {
                    "id": record.id,
                    "appliance_id": record.appliance_id,
                    "service_provider_id": (
                        record.service_provider_id
                    ),
                    "maintenance_date": (
                        record.maintenance_date.isoformat()
                        if hasattr(
                            record.maintenance_date,
                            "isoformat"
                        )
                        else str(
                            record.maintenance_date
                        )
                    ),
                    "maintenance_type": (
                        record.maintenance_type
                    ),
                    "work_performed": (
                        record.work_performed
                    ),
                    "cost": record.cost,
                    "status": record.status,
                }
                for record in records
            ],
        }

    def update_maintenance_status(
        self,
        request: Request,
    ):
        record = MaintenanceRecord.find(
            request.param("id")
        )

        if not record:
            return {
                "success": False,
                "message": (
                    "Maintenance record not found."
                ),
            }, 404

        status = request.input(
            "status"
        )

        allowed_statuses = [
            "Pending",
            "Accepted",
            "In Progress",
            "Rescheduled",
            "Completed",
            "Rejected",
            "Cancelled",
        ]

        if status not in allowed_statuses:
            return {
                "success": False,
                "message": (
                    "Invalid maintenance status."
                ),
            }, 400

        record.status = status
        record.save()

        return {
            "success": True,
            "message": (
                "Maintenance booking status "
                "updated successfully."
            ),
            "data": {
                "id": record.id,
                "status": record.status,
            },
        }

    # =========================================================
    # REVIEW MODERATION
    # Module 4 - Feature 2
    # =========================================================

    def reviews(self, request: Request):
        reviews = Review.all()

        data = []

        for review in reviews:
            customer = User.find(
                review.customer_id
            )

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

    def update_review_status(
        self,
        request: Request,
    ):
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
            review.service_provider_id,
        ).where(
            "moderation_status",
            "visible",
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
                    2,
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
                "Review moderation status "
                "updated successfully."
            ),
        }

    # =========================================================
    # REPORT MODERATION
    # Module 4 - Feature 2
    # =========================================================

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

    def update_report_status(
        self,
        request: Request,
    ):
        report = Report.find(
            request.param("id")
        )

        if not report:
            return {
                "success": False,
                "message": "Report not found.",
            }, 404

        status = request.input(
            "status"
        )

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
                "message": (
                    "Invalid report status."
                ),
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