"""Expense Controller."""

from datetime import date

from masonite.controllers import Controller
from masonite.request import Request

from app.models.Expense import Expense
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class ExpenseController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def expense_to_dict(self, expense):
        """Convert expense to JSON-safe data."""

        expense_date = expense.expense_date

        if expense_date:
            if hasattr(expense_date, "isoformat"):
                expense_date = expense_date.isoformat()
            else:
                expense_date = str(expense_date)

        created_at = expense.created_at

        if created_at:
            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            else:
                created_at = str(created_at)

        updated_at = expense.updated_at

        if updated_at:
            if hasattr(updated_at, "isoformat"):
                updated_at = updated_at.isoformat()
            else:
                updated_at = str(updated_at)

        record = MaintenanceRecord.find(
            expense.maintenance_record_id
        )

        maintenance_type = None
        appliance_id = None
        vehicle_id = None

        if record:
            maintenance_type = record.maintenance_type
            appliance_id = record.appliance_id
            vehicle_id = record.vehicle_id

        return {
            "id": expense.id,
            "maintenance_record_id": (
                expense.maintenance_record_id
            ),
            "appliance_id": appliance_id,
            "vehicle_id": vehicle_id,
            "maintenance_type": maintenance_type,
            "amount": expense.amount,
            "expense_category": expense.expense_category,
            "expense_date": expense_date,
            "description": expense.description,
            "created_at": created_at,
            "updated_at": updated_at,
        }

    def customer_owns_record(
        self,
        request,
        record
    ):
        """Check whether logged-in customer owns record."""

        customer = request.user()

        if not customer:
            return False

        # Appliance maintenance
        if record.appliance_id is not None:

            appliance = Appliance.find(
                record.appliance_id
            )

            if not appliance:
                return False

            return (
                appliance.customer_id
                == customer.id
            )

        # Vehicle maintenance
        if record.vehicle_id is not None:

            vehicle = Vehicle.find(
                record.vehicle_id
            )

            if not vehicle:
                return False

            return (
                vehicle.customer_id
                == customer.id
            )

        return False

    def customer_owns_expense(
        self,
        request,
        expense
    ):
        """Check whether customer owns expense."""

        record = MaintenanceRecord.find(
            expense.maintenance_record_id
        )

        if not record:
            return False

        return self.customer_owns_record(
            request,
            record
        )

    # =========================================================
    # INDEX / HISTORY
    # =========================================================

    def index(self, request: Request):
        """
        Return detailed expense history for logged-in customer.

        Optional filters:
            ?maintenance_record_id=<id>
            ?category=<category>
            ?vehicle_id=<id>
            ?appliance_id=<id>
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        maintenance_record_id = request.input(
            "maintenance_record_id"
        )

        category = request.input(
            "category"
        )

        vehicle_id = request.input(
            "vehicle_id"
        )

        appliance_id = request.input(
            "appliance_id"
        )

        all_expenses = Expense.all()

        expenses = []

        for expense in all_expenses:

            record = MaintenanceRecord.find(
                expense.maintenance_record_id
            )

            if not record:
                continue

            if not self.customer_owns_record(
                request,
                record
            ):
                continue

            # ---------------------------------------------
            # Maintenance record filter
            # ---------------------------------------------

            if (
                maintenance_record_id
                and str(
                    record.id
                ) != str(
                    maintenance_record_id
                )
            ):
                continue

            # ---------------------------------------------
            # Category filter
            # ---------------------------------------------

            if (
                category
                and expense.expense_category
                != category
            ):
                continue

            # ---------------------------------------------
            # Vehicle filter
            # ---------------------------------------------

            if (
                vehicle_id
                and str(
                    record.vehicle_id
                ) != str(
                    vehicle_id
                )
            ):
                continue

            # ---------------------------------------------
            # Appliance filter
            # ---------------------------------------------

            if (
                appliance_id
                and str(
                    record.appliance_id
                ) != str(
                    appliance_id
                )
            ):
                continue

            expenses.append(expense)

        return {
            "success": True,
            "data": [
                self.expense_to_dict(expense)
                for expense in expenses
            ]
        }

    # =========================================================
    # SUMMARY
    # =========================================================

    def summary(self, request: Request):
        """
        Return categorized expense summary.

        Includes:
            total expense
            expense count
            amount by category
        """

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": "Authentication required."
            }, 401

        vehicle_id = request.input(
            "vehicle_id"
        )

        appliance_id = request.input(
            "appliance_id"
        )

        all_expenses = Expense.all()

        category_totals = {}
        total_amount = 0
        total_count = 0

        for expense in all_expenses:

            record = MaintenanceRecord.find(
                expense.maintenance_record_id
            )

            if not record:
                continue

            if not self.customer_owns_record(
                request,
                record
            ):
                continue

            if (
                vehicle_id
                and str(record.vehicle_id)
                != str(vehicle_id)
            ):
                continue

            if (
                appliance_id
                and str(record.appliance_id)
                != str(appliance_id)
            ):
                continue

            amount = expense.amount or 0

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                continue

            category = (
                expense.expense_category
                or "Other"
            )

            total_amount += amount
            total_count += 1

            category_totals[category] = (
                category_totals.get(
                    category,
                    0
                )
                + amount
            )

        categories = [
            {
                "expense_category": category,
                "total_amount": total,
            }
            for category, total
            in category_totals.items()
        ]

        categories.sort(
            key=lambda item: item["total_amount"],
            reverse=True
        )

        return {
            "success": True,
            "data": {
                "total_amount": total_amount,
                "expense_count": total_count,
                "by_category": categories,
            }
        }

    # =========================================================
    # SHOW
    # =========================================================

    def show(self, request: Request):
        """Return one customer-owned expense."""

        expense_id = request.param("id")

        expense = Expense.find(
            expense_id
        )

        if not expense:
            return {
                "success": False,
                "message": "Expense not found."
            }, 404

        if not self.customer_owns_expense(
            request,
            expense
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to access "
                    "this expense."
                )
            }, 403

        return {
            "success": True,
            "data": self.expense_to_dict(
                expense
            )
        }

    # =========================================================
    # CREATE
    # =========================================================

    def store(self, request: Request):
        """Create an expense for a customer-owned maintenance record."""

        maintenance_record_id = request.input(
            "maintenance_record_id"
        )

        amount = request.input(
            "amount"
        )

        expense_category = request.input(
            "expense_category"
        )

        expense_date = request.input(
            "expense_date"
        )

        description = request.input(
            "description"
        )

        # -----------------------------------------------------
        # Required fields
        # -----------------------------------------------------

        if not maintenance_record_id:
            return {
                "success": False,
                "message": (
                    "maintenance_record_id is required."
                )
            }, 400

        if amount in (None, ""):
            return {
                "success": False,
                "message": "amount is required."
            }, 400

        if not expense_category:
            return {
                "success": False,
                "message": (
                    "expense_category is required."
                )
            }, 400

        if not expense_date:
            return {
                "success": False,
                "message": "expense_date is required."
            }, 400

        # -----------------------------------------------------
        # Maintenance record
        # -----------------------------------------------------

        record = MaintenanceRecord.find(
            maintenance_record_id
        )

        if not record:
            return {
                "success": False,
                "message": (
                    "Maintenance record not found."
                )
            }, 404

        if not self.customer_owns_record(
            request,
            record
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to "
                    "add an expense to this maintenance record."
                )
            }, 403

        # -----------------------------------------------------
        # Amount
        # -----------------------------------------------------

        try:
            amount = float(amount)

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid amount."
            }, 400

        if amount < 0:
            return {
                "success": False,
                "message": (
                    "amount cannot be negative."
                )
            }, 400

        # -----------------------------------------------------
        # Date
        # -----------------------------------------------------

        try:
            expense_date = date.fromisoformat(
                expense_date
            )

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": (
                    "Invalid expense_date format. "
                    "Use YYYY-MM-DD."
                )
            }, 400

        # -----------------------------------------------------
        # Create
        # -----------------------------------------------------

        expense = Expense.create({
            "maintenance_record_id": (
                maintenance_record_id
            ),
            "amount": amount,
            "expense_category": (
                expense_category.strip()
            ),
            "expense_date": expense_date,
            "description": (
                description.strip()
                if description
                else None
            ),
        })

        return {
            "success": True,
            "message": (
                "Expense added successfully."
            ),
            "data": self.expense_to_dict(
                expense
            )
        }, 201

    # =========================================================
    # UPDATE
    # =========================================================

    def update(self, request: Request):
        """Update a customer-owned expense."""

        expense_id = request.param("id")

        expense = Expense.find(
            expense_id
        )

        if not expense:
            return {
                "success": False,
                "message": "Expense not found."
            }, 404

        if not self.customer_owns_expense(
            request,
            expense
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to update "
                    "this expense."
                )
            }, 403

        amount = request.input(
            "amount",
            expense.amount
        )

        expense_category = request.input(
            "expense_category",
            expense.expense_category
        )

        expense_date = request.input(
            "expense_date",
            expense.expense_date
        )

        description = request.input(
            "description",
            expense.description
        )

        # -----------------------------------------------------
        # Amount
        # -----------------------------------------------------

        try:
            amount = float(amount)

        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Invalid amount."
            }, 400

        if amount < 0:
            return {
                "success": False,
                "message": (
                    "amount cannot be negative."
                )
            }, 400

        # -----------------------------------------------------
        # Category
        # -----------------------------------------------------

        if not expense_category:
            return {
                "success": False,
                "message": (
                    "expense_category is required."
                )
            }, 400

        # -----------------------------------------------------
        # Date
        # -----------------------------------------------------

        if isinstance(
            expense_date,
            str
        ):

            try:
                expense_date = date.fromisoformat(
                    expense_date
                )

            except (ValueError, TypeError):
                return {
                    "success": False,
                    "message": (
                        "Invalid expense_date format. "
                        "Use YYYY-MM-DD."
                    )
                }, 400

        # -----------------------------------------------------
        # Save
        # -----------------------------------------------------

        expense.amount = amount

        expense.expense_category = (
            expense_category.strip()
        )

        expense.expense_date = (
            expense_date
        )

        expense.description = (
            description.strip()
            if description
            else None
        )

        expense.save()

        return {
            "success": True,
            "message": (
                "Expense updated successfully."
            ),
            "data": self.expense_to_dict(
                expense
            )
        }

    # =========================================================
    # DELETE
    # =========================================================

    def destroy(self, request: Request):
        """Delete a customer-owned expense."""

        expense_id = request.param("id")

        expense = Expense.find(
            expense_id
        )

        if not expense:
            return {
                "success": False,
                "message": "Expense not found."
            }, 404

        if not self.customer_owns_expense(
            request,
            expense
        ):
            return {
                "success": False,
                "message": (
                    "You do not have permission to delete "
                    "this expense."
                )
            }, 403

        expense.delete()

        return {
            "success": True,
            "message": (
                "Expense deleted successfully."
            )
        }