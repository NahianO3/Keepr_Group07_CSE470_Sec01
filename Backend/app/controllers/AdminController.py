'''Admin Controller.'''
from masonite.controllers import Controller
from masonite.request import Request

from app.models.User import User
from app.models.MaintenanceRecord import MaintenanceRecord


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
                        if hasattr(record.maintenance_date, "isoformat")
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