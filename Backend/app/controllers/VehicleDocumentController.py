"""Vehicle Document Controller."""

from datetime import date, timedelta

from masonite.controllers import Controller
from masonite.request import Request

from app.models.VehicleDocument import VehicleDocument
from app.models.Vehicle import Vehicle


class VehicleDocumentController(Controller):

    # =========================================================
    # SERIALIZATION
    # =========================================================

    def document_to_dict(self, document):
        """Convert vehicle document to JSON-safe data."""

        def to_iso(value):
            if not value:
                return value

            return (
                value.isoformat()
                if hasattr(value, "isoformat")
                else str(value)
            )

        status = self.calculate_status(
            document.expiry_date
        )

        return {
            "id": document.id,
            "vehicle_id": document.vehicle_id,
            "document_type": document.document_type,
            "issue_date": to_iso(
                document.issue_date
            ),
            "expiry_date": to_iso(
                document.expiry_date
            ),
            "document_status": status,
            "document_path": document.document_path,
            "created_at": to_iso(
                document.created_at
            ),
            "updated_at": to_iso(
                document.updated_at
            ),
        }

    # =========================================================
    # OWNERSHIP
    # =========================================================

    def customer_owns_vehicle(
        self,
        request,
        vehicle
    ):
        """Check whether logged-in customer owns vehicle."""

        customer = request.user()

        if not customer:
            return False

        return vehicle.customer_id == customer.id

    def customer_owns_document(
        self,
        request,
        document
    ):
        """Check whether logged-in customer owns document."""

        vehicle = Vehicle.find(
            document.vehicle_id
        )

        if not vehicle:
            return False

        return self.customer_owns_vehicle(
            request,
            vehicle
        )

    # =========================================================
    # STATUS
    # =========================================================

    def calculate_status(self, expiry_date):
        """
        Calculate document status from expiry date.

        Expired:
            expiry date is before today.

        Expiring Soon:
            expiry date is within the next 30 days.

        Active:
            expiry date is more than 30 days away.

        No Expiry:
            no expiry date was supplied.
        """

        if not expiry_date:
            return "No Expiry"

        if isinstance(expiry_date, str):
            try:
                expiry_date = date.fromisoformat(
                    expiry_date
                )
            except (ValueError, TypeError):
                return "Unknown"

        today = date.today()

        if expiry_date < today:
            return "Expired"

        warning_limit = (
            today + timedelta(days=30)
        )

        if expiry_date <= warning_limit:
            return "Expiring Soon"

        return "Active"

    # =========================================================
    # VALIDATION
    # =========================================================

    def parse_date(
        self,
        value,
        field_name
    ):
        """Parse YYYY-MM-DD date."""

        if value in (None, ""):
            return None

        try:
            return date.fromisoformat(value)

        except (ValueError, TypeError):
            raise ValueError(
                f"Invalid {field_name} format. "
                f"Use YYYY-MM-DD."
            )

    # =========================================================
    # INDEX
    # =========================================================

    def index(self, request: Request):
        """
        Return vehicle documents for the logged-in customer.

        Optional:
            ?vehicle_id=<id>
            ?document_type=Insurance
            ?status=Expired
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        vehicle_id = request.input(
            "vehicle_id"
        )

        document_type = request.input(
            "document_type"
        )

        requested_status = request.input(
            "status"
        )

        # -----------------------------------------------------
        # Vehicle-specific query
        # -----------------------------------------------------

        if vehicle_id:

            vehicle = Vehicle.find(
                vehicle_id
            )

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
                        "You do not have permission to "
                        "access this vehicle."
                    ),
                }, 403

            documents = VehicleDocument.where(
                "vehicle_id",
                vehicle_id
            ).get()

        # -----------------------------------------------------
        # All documents belonging to customer vehicles
        # -----------------------------------------------------

        else:

            customer_vehicles = Vehicle.where(
                "customer_id",
                customer.id
            ).get()

            owned_vehicle_ids = {
                vehicle.id
                for vehicle in customer_vehicles
            }

            all_documents = VehicleDocument.all()

            documents = [
                document
                for document in all_documents
                if document.vehicle_id
                in owned_vehicle_ids
            ]

        # -----------------------------------------------------
        # Optional document-type filter
        # -----------------------------------------------------

        if document_type:

            documents = [
                document
                for document in documents
                if document.document_type
                == document_type
            ]

        # -----------------------------------------------------
        # Optional status filter
        # -----------------------------------------------------

        if requested_status:

            documents = [
                document
                for document in documents
                if self.calculate_status(
                    document.expiry_date
                ) == requested_status
            ]

        return {
            "success": True,
            "data": [
                self.document_to_dict(
                    document
                )
                for document in documents
            ],
        }

    # =========================================================
    # SHOW
    # =========================================================

    def show(self, request: Request):
        """Return one customer-owned vehicle document."""

        document_id = request.param("id")

        document = VehicleDocument.find(
            document_id
        )

        if not document:
            return {
                "success": False,
                "message": "Vehicle document not found.",
            }, 404

        if not self.customer_owns_document(
            request,
            document
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to "
                    "access this document."
                ),
            }, 403

        return {
            "success": True,
            "data": self.document_to_dict(
                document
            ),
        }

    # =========================================================
    # CREATE
    # =========================================================

    def store(self, request: Request):
        """Create a vehicle document."""

        vehicle_id = request.input(
            "vehicle_id"
        )

        if not vehicle_id:
            return {
                "success": False,
                "message": "vehicle_id is required.",
            }, 400

        vehicle = Vehicle.find(
            vehicle_id
        )

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
                    "You do not have permission to "
                    "manage documents for this vehicle."
                ),
            }, 403

        document_type = request.input(
            "document_type"
        )

        issue_date = request.input(
            "issue_date"
        )

        expiry_date = request.input(
            "expiry_date"
        )

        document_path = request.input(
            "document_path"
        )

        # -----------------------------------------------------
        # Document type
        # -----------------------------------------------------

        allowed_types = [
            "Insurance",
            "Registration",
            "Tax Token",
        ]

        if document_type not in allowed_types:
            return {
                "success": False,
                "message": (
                    "Invalid document_type. Use "
                    "Insurance, Registration, or Tax Token."
                ),
            }, 400

        # -----------------------------------------------------
        # Dates
        # -----------------------------------------------------

        try:
            issue_date = self.parse_date(
                issue_date,
                "issue_date"
            )

            expiry_date = self.parse_date(
                expiry_date,
                "expiry_date"
            )

        except ValueError as error:

            return {
                "success": False,
                "message": str(error),
            }, 400

        # -----------------------------------------------------
        # Date relationship
        # -----------------------------------------------------

        if (
            issue_date
            and expiry_date
            and expiry_date < issue_date
        ):
            return {
                "success": False,
                "message": (
                    "expiry_date cannot be earlier "
                    "than issue_date."
                ),
            }, 400

        # -----------------------------------------------------
        # Document path/reference
        # -----------------------------------------------------

        if document_path == "":
            document_path = None

        # -----------------------------------------------------
        # Create
        # -----------------------------------------------------

        document = VehicleDocument.create({
            "vehicle_id": vehicle_id,
            "document_type": document_type,
            "issue_date": issue_date,
            "expiry_date": expiry_date,
            "document_status": (
                self.calculate_status(
                    expiry_date
                )
            ),
            "document_path": document_path,
        })

        return {
            "success": True,
            "message": (
                "Vehicle document added successfully."
            ),
            "data": self.document_to_dict(
                document
            ),
        }, 201

    # =========================================================
    # UPDATE
    # =========================================================

    def update(self, request: Request):
        """Update a customer-owned vehicle document."""

        document_id = request.param("id")

        document = VehicleDocument.find(
            document_id
        )

        if not document:
            return {
                "success": False,
                "message": "Vehicle document not found.",
            }, 404

        if not self.customer_owns_document(
            request,
            document
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to "
                    "update this document."
                ),
            }, 403

        document_type = request.input(
            "document_type",
            document.document_type
        )

        issue_date_input = request.input(
            "issue_date"
        )

        expiry_date_input = request.input(
            "expiry_date"
        )

        document_path = request.input(
            "document_path",
            document.document_path
        )

        # -----------------------------------------------------
        # Type
        # -----------------------------------------------------

        allowed_types = [
            "Insurance",
            "Registration",
            "Tax Token",
        ]

        if document_type not in allowed_types:
            return {
                "success": False,
                "message": (
                    "Invalid document_type. Use "
                    "Insurance, Registration, or Tax Token."
                ),
            }, 400

        # -----------------------------------------------------
        # Dates
        # -----------------------------------------------------

        try:

            issue_date = (
                document.issue_date
                if issue_date_input is None
                else self.parse_date(
                    issue_date_input,
                    "issue_date"
                )
            )

            expiry_date = (
                document.expiry_date
                if expiry_date_input is None
                else self.parse_date(
                    expiry_date_input,
                    "expiry_date"
                )
            )

        except ValueError as error:

            return {
                "success": False,
                "message": str(error),
            }, 400

        # -----------------------------------------------------
        # Date relationship
        # -----------------------------------------------------

        if (
            issue_date
            and expiry_date
            and expiry_date < issue_date
        ):
            return {
                "success": False,
                "message": (
                    "expiry_date cannot be earlier "
                    "than issue_date."
                ),
            }, 400

        document.document_type = (
            document_type
        )

        document.issue_date = (
            issue_date
        )

        document.expiry_date = (
            expiry_date
        )

        document.document_status = (
            self.calculate_status(
                expiry_date
            )
        )

        document.document_path = (
            document_path
        )

        document.save()

        return {
            "success": True,
            "message": (
                "Vehicle document updated successfully."
            ),
            "data": self.document_to_dict(
                document
            ),
        }

    # =========================================================
    # EXPIRY / DUE
    # =========================================================

    def expiry_due(self, request: Request):
        """
        Return vehicle documents that are expired or expiring
        within 30 days.
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required.",
            }, 401

        customer_vehicles = Vehicle.where(
            "customer_id",
            customer.id
        ).get()

        owned_vehicle_ids = {
            vehicle.id
            for vehicle in customer_vehicles
        }

        all_documents = VehicleDocument.all()

        today = date.today()

        warning_limit = (
            today + timedelta(days=30)
        )

        due_documents = []

        for document in all_documents:

            if (
                document.vehicle_id
                not in owned_vehicle_ids
            ):
                continue

            expiry_date = document.expiry_date

            if isinstance(
                expiry_date,
                str
            ):
                try:
                    expiry_date = (
                        date.fromisoformat(
                            expiry_date
                        )
                    )
                except (
                    ValueError,
                    TypeError
                ):
                    continue

            if not expiry_date:
                continue

            if expiry_date <= warning_limit:

                due_documents.append(
                    self.document_to_dict(
                        document
                    )
                )

        return {
            "success": True,
            "data": due_documents,
        }

    # =========================================================
    # DELETE
    # =========================================================

    def destroy(self, request: Request):
        """Delete a customer-owned vehicle document."""

        document_id = request.param("id")

        document = VehicleDocument.find(
            document_id
        )

        if not document:
            return {
                "success": False,
                "message": "Vehicle document not found.",
            }, 404

        if not self.customer_owns_document(
            request,
            document
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to "
                    "delete this document."
                ),
            }, 403

        document.delete()

        return {
            "success": True,
            "message": (
                "Vehicle document deleted successfully."
            ),
        }