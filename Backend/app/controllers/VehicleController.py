"""Vehicle Controller."""

from datetime import date, timedelta

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Vehicle import Vehicle
from app.models.MaintenanceSchedule import MaintenanceSchedule


class VehicleController(Controller):

    # =========================================================
    # SERIALIZATION
    # =========================================================

    def vehicle_to_dict(self, vehicle):
        """Convert a vehicle model to JSON-safe data."""

        def to_iso(value):
            if not value:
                return value

            return (
                value.isoformat()
                if hasattr(value, "isoformat")
                else str(value)
            )

        return {
            "id": vehicle.id,
            "customer_id": vehicle.customer_id,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "purchase_date": to_iso(vehicle.purchase_date),
            "current_mileage": vehicle.current_mileage,
            "last_service_mileage": vehicle.last_service_mileage,
            "maintenance_interval_km": vehicle.maintenance_interval_km,
            "maintenance_interval_days": vehicle.maintenance_interval_days,
            "insurance_status": vehicle.insurance_status,
            "registration_status": vehicle.registration_status,
            "tax_token_status": vehicle.tax_token_status,
            "created_at": to_iso(vehicle.created_at),
            "updated_at": to_iso(vehicle.updated_at),
        }

    # =========================================================
    # OWNERSHIP
    # =========================================================

    def customer_owns_vehicle(self, request, vehicle):
        """Check whether logged-in customer owns the vehicle."""

        customer = request.user()

        if not customer:
            return False

        return vehicle.customer_id == customer.id

    # =========================================================
    # VALIDATION HELPERS
    # =========================================================

    def parse_positive_float(self, value, field_name):
        try:
            value = float(value)
        except (ValueError, TypeError):
            raise ValueError(
                f"{field_name} must be numeric."
            )

        if value < 0:
            raise ValueError(
                f"{field_name} cannot be negative."
            )

        return value

    def parse_positive_int(self, value, field_name):
        try:
            value = int(value)
        except (ValueError, TypeError):
            raise ValueError(
                f"{field_name} must be numeric."
            )

        if value <= 0:
            raise ValueError(
                f"{field_name} must be greater than 0."
            )

        return value

    # =========================================================
    # SCHEDULE CALCULATIONS
    # =========================================================

    def calculate_initial_service_date(self, vehicle):
        """
        Calculate the first upcoming time-based service date.

        The initial cycle starts from the purchase date.
        If several service intervals have already elapsed,
        advance through the intervals until the next upcoming date.
        """

        interval_days = vehicle.maintenance_interval_days

        if not interval_days:
            return None

        purchase_date = vehicle.purchase_date

        if not purchase_date:
            return None

        if isinstance(purchase_date, str):
            purchase_date = date.fromisoformat(
                purchase_date
            )

        next_service_date = (
            purchase_date
            + timedelta(days=int(interval_days))
        )

        today = date.today()

        while next_service_date < today:
            next_service_date += timedelta(
                days=int(interval_days)
            )

        return next_service_date

    def calculate_next_service_mileage(self, vehicle):
        """Calculate mileage threshold for next service."""

        interval_km = vehicle.maintenance_interval_km

        if not interval_km:
            return None

        base_mileage = vehicle.last_service_mileage

        if base_mileage is None:
            base_mileage = vehicle.current_mileage

        if base_mileage is None:
            return None

        return float(base_mileage) + float(interval_km)

    def get_vehicle_schedule(self, vehicle):
        """Return the vehicle's existing schedule."""

        return (
            MaintenanceSchedule
            .where("vehicle_id", vehicle.id)
            .first()
        )

    def create_vehicle_schedule(self, vehicle):
        """Create the initial recurring schedule for a vehicle."""

        schedule = MaintenanceSchedule.create({
            "appliance_id": None,
            "vehicle_id": vehicle.id,
            "next_service_date": (
                self.calculate_initial_service_date(
                    vehicle
                )
            ),
            "next_service_mileage": (
                self.calculate_next_service_mileage(
                    vehicle
                )
            ),
            "interval_days": (
                vehicle.maintenance_interval_days
            ),
            "reminder_enabled": True,
        })

        return schedule

    def sync_vehicle_schedule(
        self,
        vehicle,
        recalculate_date=False,
        recalculate_mileage=False,
    ):
        """
        Keep the single vehicle schedule synchronized.

        Mileage updates do NOT reset the time-based date unless
        explicitly requested.
        """

        schedule = self.get_vehicle_schedule(
            vehicle
        )

        if not schedule:
            return self.create_vehicle_schedule(
                vehicle
            )

        changed = False

        if recalculate_date:
            schedule.next_service_date = (
                self.calculate_initial_service_date(
                    vehicle
                )
            )
            changed = True

        if recalculate_mileage:
            schedule.next_service_mileage = (
                self.calculate_next_service_mileage(
                    vehicle
                )
            )
            changed = True

        schedule.interval_days = (
            vehicle.maintenance_interval_days
        )

        changed = True

        if changed:
            schedule.save()

        return schedule

    # =========================================================
    # GET ALL
    # =========================================================

    def index(self, request: Request):
        """Return vehicles belonging to logged-in customer."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        vehicles = Vehicle.where(
            "customer_id",
            customer.id
        ).get()

        return {
            "success": True,
            "data": [
                self.vehicle_to_dict(vehicle)
                for vehicle in vehicles
            ],
        }

    # =========================================================
    # GET ONE
    # =========================================================

    def show(self, request: Request):
        """Return one customer-owned vehicle."""

        vehicle_id = request.param("id")

        vehicle = Vehicle.find(vehicle_id)

        if not vehicle:
            return {
                "success": False,
                "message": "Vehicle not found.",
            }, 404

        if not self.customer_owns_vehicle(
            request,
            vehicle
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to access "
                    "this vehicle."
                ),
            }, 403

        return {
            "success": True,
            "data": self.vehicle_to_dict(vehicle),
        }

    # =========================================================
    # CREATE
    # =========================================================

    def store(self, request: Request):
        """Register a vehicle and generate its schedule."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        required_fields = [
            "brand",
            "model",
            "purchase_date",
            "current_mileage",
            "maintenance_interval_km",
            "maintenance_interval_days",
        ]

        for field in required_fields:
            if request.input(field) in (None, ""):
                return {
                    "success": False,
                    "message": f"{field} is required.",
                }, 400

        try:
            purchase_date = date.fromisoformat(
                request.input("purchase_date")
            )
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid purchase_date format. "
                    "Use YYYY-MM-DD."
                ),
            }, 400

        try:
            current_mileage = self.parse_positive_float(
                request.input("current_mileage"),
                "current_mileage",
            )

            maintenance_interval_km = (
                self.parse_positive_int(
                    request.input("maintenance_interval_km"),
                    "maintenance_interval_km",
                )
            )

            maintenance_interval_days = (
                self.parse_positive_int(
                    request.input("maintenance_interval_days"),
                    "maintenance_interval_days",
                )
            )

        except ValueError as error:
            return {
                "success": False,
                "message": str(error),
            }, 400

        last_service_mileage = (
            request.input("last_service_mileage")
        )

        if last_service_mileage in (None, ""):
            last_service_mileage = None

        else:
            try:
                last_service_mileage = (
                    self.parse_positive_float(
                        last_service_mileage,
                        "last_service_mileage",
                    )
                )

            except ValueError as error:
                return {
                    "success": False,
                    "message": str(error),
                }, 400

            if last_service_mileage > current_mileage:
                return {
                    "success": False,
                    "message": (
                        "last_service_mileage cannot be "
                        "greater than current_mileage."
                    ),
                }, 400

        vehicle = Vehicle.create({
            "customer_id": customer.id,
            "brand": request.input("brand").strip(),
            "model": request.input("model").strip(),
            "purchase_date": purchase_date,
            "current_mileage": current_mileage,
            "last_service_mileage": last_service_mileage,
            "maintenance_interval_km": (
                maintenance_interval_km
            ),
            "maintenance_interval_days": (
                maintenance_interval_days
            ),
            "insurance_status": (
                request.input("insurance_status")
                or "Unknown"
            ),
            "registration_status": (
                request.input("registration_status")
                or "Unknown"
            ),
            "tax_token_status": (
                request.input("tax_token_status")
                or "Unknown"
            ),
        })

        schedule = self.create_vehicle_schedule(
            vehicle
        )

        data = self.vehicle_to_dict(vehicle)

        data["maintenance_schedule_id"] = (
            schedule.id
        )

        return {
            "success": True,
            "message": "Vehicle registered successfully.",
            "data": data,
        }, 201

    # =========================================================
    # UPDATE PROFILE
    # =========================================================

    def update(self, request: Request):
        """Update a customer-owned vehicle."""

        vehicle_id = request.param("id")

        vehicle = Vehicle.find(vehicle_id)

        if not vehicle:
            return {
                "success": False,
                "message": "Vehicle not found.",
            }, 404

        if not self.customer_owns_vehicle(
            request,
            vehicle
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this vehicle."
                ),
            }, 403

        old_purchase_date = vehicle.purchase_date
        old_interval_km = vehicle.maintenance_interval_km
        old_interval_days = (
            vehicle.maintenance_interval_days
        )
        old_last_service = (
            vehicle.last_service_mileage
        )

        brand = request.input(
            "brand",
            vehicle.brand
        )

        model = request.input(
            "model",
            vehicle.model
        )

        purchase_date = request.input(
            "purchase_date"
        )

        if purchase_date:
            try:
                purchase_date = date.fromisoformat(
                    purchase_date
                )
            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": (
                        "Invalid purchase_date format. "
                        "Use YYYY-MM-DD."
                    ),
                }, 400
        else:
            purchase_date = vehicle.purchase_date

        try:
            current_mileage = self.parse_positive_float(
                request.input(
                    "current_mileage",
                    vehicle.current_mileage
                ),
                "current_mileage",
            )

            maintenance_interval_km = (
                self.parse_positive_int(
                    request.input(
                        "maintenance_interval_km",
                        vehicle.maintenance_interval_km
                    ),
                    "maintenance_interval_km",
                )
            )

            maintenance_interval_days = (
                self.parse_positive_int(
                    request.input(
                        "maintenance_interval_days",
                        vehicle.maintenance_interval_days
                    ),
                    "maintenance_interval_days",
                )
            )

        except ValueError as error:
            return {
                "success": False,
                "message": str(error),
            }, 400

        last_service_mileage = request.input(
            "last_service_mileage",
            vehicle.last_service_mileage
        )

        if last_service_mileage in (None, ""):
            last_service_mileage = None

        else:
            try:
                last_service_mileage = (
                    self.parse_positive_float(
                        last_service_mileage,
                        "last_service_mileage",
                    )
                )
            except ValueError as error:
                return {
                    "success": False,
                    "message": str(error),
                }, 400

            if last_service_mileage > current_mileage:
                return {
                    "success": False,
                    "message": (
                        "last_service_mileage cannot be "
                        "greater than current_mileage."
                    ),
                }, 400

        vehicle.brand = brand.strip()
        vehicle.model = model.strip()
        vehicle.purchase_date = purchase_date
        vehicle.current_mileage = current_mileage
        vehicle.last_service_mileage = (
            last_service_mileage
        )
        vehicle.maintenance_interval_km = (
            maintenance_interval_km
        )
        vehicle.maintenance_interval_days = (
            maintenance_interval_days
        )

        vehicle.insurance_status = request.input(
            "insurance_status",
            vehicle.insurance_status
        )

        vehicle.registration_status = request.input(
            "registration_status",
            vehicle.registration_status
        )

        vehicle.tax_token_status = request.input(
            "tax_token_status",
            vehicle.tax_token_status
        )

        vehicle.save()

        schedule = self.get_vehicle_schedule(
            vehicle
        )

        interval_changed = (
            old_interval_km != maintenance_interval_km
            or old_interval_days != maintenance_interval_days
        )

        purchase_date_changed = (
            str(old_purchase_date)
            != str(purchase_date)
        )

        last_service_changed = (
            old_last_service
            != last_service_mileage
        )

        if not schedule:
            schedule = self.create_vehicle_schedule(
                vehicle
            )
        else:
            schedule.interval_days = (
                maintenance_interval_days
            )

            if interval_changed or purchase_date_changed:
                schedule.next_service_date = (
                    self.calculate_initial_service_date(
                        vehicle
                    )
                )

            if interval_changed or last_service_changed:
                schedule.next_service_mileage = (
                    self.calculate_next_service_mileage(
                        vehicle
                    )
                )

            schedule.save()

        data = self.vehicle_to_dict(vehicle)

        data["maintenance_schedule_id"] = (
            schedule.id
        )

        return {
            "success": True,
            "message": "Vehicle updated successfully.",
            "data": data,
        }

    # =========================================================
    # MILEAGE UPDATE
    # =========================================================

    def update_mileage(self, request: Request):
        """
        Update current mileage only.

        This does NOT reset the time-based service date.
        """

        vehicle_id = request.param("id")

        vehicle = Vehicle.find(vehicle_id)

        if not vehicle:
            return {
                "success": False,
                "message": "Vehicle not found.",
            }, 404

        if not self.customer_owns_vehicle(
            request,
            vehicle
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this vehicle."
                ),
            }, 403

        current_mileage = request.input(
            "current_mileage"
        )

        if current_mileage in (None, ""):
            return {
                "success": False,
                "message": "current_mileage is required.",
            }, 400

        try:
            current_mileage = (
                self.parse_positive_float(
                    current_mileage,
                    "current_mileage",
                )
            )
        except ValueError as error:
            return {
                "success": False,
                "message": str(error),
            }, 400

        if current_mileage < (
            vehicle.current_mileage or 0
        ):
            return {
                "success": False,
                "message": (
                    "current_mileage cannot be lower than "
                    "the vehicle's existing mileage."
                ),
            }, 400

        vehicle.current_mileage = current_mileage
        vehicle.save()

        schedule = self.get_vehicle_schedule(
            vehicle
        )

        if not schedule:
            schedule = self.create_vehicle_schedule(
                vehicle
            )

        data = self.vehicle_to_dict(vehicle)

        data["maintenance_schedule_id"] = (
            schedule.id
        )

        return {
            "success": True,
            "message": (
                "Vehicle mileage updated successfully."
            ),
            "data": data,
        }

    # =========================================================
    # DELETE
    # =========================================================

    def destroy(self, request: Request):
        """Delete a customer-owned vehicle."""

        vehicle_id = request.param("id")

        vehicle = Vehicle.find(vehicle_id)

        if not vehicle:
            return {
                "success": False,
                "message": "Vehicle not found.",
            }, 404

        if not self.customer_owns_vehicle(
            request,
            vehicle
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this vehicle."
                ),
            }, 403

        MaintenanceSchedule.where(
            "vehicle_id",
            vehicle.id
        ).delete()

        vehicle.delete()

        return {
            "success": True,
            "message": "Vehicle deleted successfully.",
        }