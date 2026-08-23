"""Maintenance Image Controller."""

import base64
import io
import os

from masonite.controllers import Controller
from masonite.filesystem import Storage
from masonite.request import Request

from app.models.MaintenanceImage import MaintenanceImage
from app.models.MaintenanceRecord import MaintenanceRecord
from app.models.Appliance import Appliance
from app.models.Vehicle import Vehicle


class MaintenanceImageController(Controller):

    # =========================================================
    # HELPERS
    # =========================================================

    def customer_owns_record(
        self,
        request,
        record
    ):
        """Check whether the logged-in customer owns the record."""

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

    def image_to_dict(
        self,
        image,
        storage
    ):
        """Return database record plus browser-displayable images."""

        result = {
            "id": image.id,
            "maintenance_record_id":
                image.maintenance_record_id,
            "before_image_path":
                image.before_image_path,
            "after_image_path":
                image.after_image_path,
            "improvement_score":
                image.improvement_score,
        }

        # Add base64 previews when files exist.
        if image.before_image_path:
            result["before_image"] = (
                self.file_to_data_url(
                    storage,
                    image.before_image_path
                )
            )
        else:
            result["before_image"] = None

        if image.after_image_path:
            result["after_image"] = (
                self.file_to_data_url(
                    storage,
                    image.after_image_path
                )
            )
        else:
            result["after_image"] = None

        return result

    def file_to_data_url(
        self,
        storage,
        path
    ):
        """
        Read an uploaded image and return a data URL.

        This keeps the implementation independent from
        a separate static-file server while the project
        is being developed.
        """

        if not path:
            return None

        try:
            content = storage.disk(
                "local"
            ).get(path)

            if isinstance(content, str):
                content = content.encode()

            encoded = base64.b64encode(
                content
            ).decode("utf-8")

            extension = (
                os.path.splitext(path)[1]
                .lower()
            )

            mime_types = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
                ".gif": "image/gif",
            }

            mime_type = mime_types.get(
                extension,
                "application/octet-stream"
            )

            return (
                f"data:{mime_type};base64,"
                f"{encoded}"
            )

        except Exception:
            return None

    def calculate_improvement_score(
        self,
        before_resource,
        after_resource
    ):
        """
        Calculate a simple automatic visual-change score.

        The score is based on normalized pixel difference
        between the before and after images.

        It represents the amount of visible change:
            0   = almost no visual change
            100 = very large visual change

        This is a visual comparison score, not a semantic
        judgment of whether the maintenance was beneficial.
        """

        try:
            from PIL import Image
            import numpy as np
        except ImportError:
            return None

        try:
            before_bytes = (
                before_resource.read()
            )

            after_bytes = (
                after_resource.read()
            )

            before_image = Image.open(
                io.BytesIO(before_bytes)
            ).convert("RGB")

            after_image = Image.open(
                io.BytesIO(after_bytes)
            ).convert("RGB")

            # Normalize both images to the same size.
            width = 256
            height = 256

            before_image = before_image.resize(
                (width, height)
            )

            after_image = after_image.resize(
                (width, height)
            )

            before_array = np.asarray(
                before_image,
                dtype=np.float32
            )

            after_array = np.asarray(
                after_image,
                dtype=np.float32
            )

            difference = np.abs(
                before_array
                - after_array
            )

            mean_difference = (
                difference.mean()
            )

            score = (
                mean_difference
                / 255.0
            ) * 100.0

            score = max(
                0.0,
                min(
                    100.0,
                    score
                )
            )

            return round(
                score,
                2
            )

        except Exception:
            return None

    # =========================================================
    # GET IMAGES
    # =========================================================

    def show(self, request: Request):
        """Return before/after images for a maintenance record."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": (
                    "Authentication required."
                )
            }, 401

        record = MaintenanceRecord.find(
            request.param("id")
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
                    "You do not have permission "
                    "to access these images."
                )
            }, 403

        image = MaintenanceImage.where(
            "maintenance_record_id",
            record.id
        ).first()

        if not image:
            return {
                "success": True,
                "data": None
            }

        storage = Storage()

        return {
            "success": True,
            "data": self.image_to_dict(
                image,
                storage
            )
        }

    # =========================================================
    # UPLOAD
    # =========================================================

    def store(
        self,
        storage: Storage,
        request: Request
    ):
        """Upload before/after images for a completed record."""

        customer = request.user()

        if not customer:
            return {
                "success": False,
                "message": (
                    "Authentication required."
                )
            }, 401

        record = MaintenanceRecord.find(
            request.param("id")
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
                    "You do not have permission "
                    "to upload images for this record."
                )
            }, 403

        if record.status != "Completed":
            return {
                "success": False,
                "message": (
                    "Before and after images can only "
                    "be uploaded for completed maintenance."
                )
            }, 409

        before_image = request.input(
            "before_image"
        )

        after_image = request.input(
            "after_image"
        )

        if not before_image:
            return {
                "success": False,
                "message": (
                    "before_image is required."
                )
            }, 400

        if not after_image:
            return {
                "success": False,
                "message": (
                    "after_image is required."
                )
            }, 400

        # -----------------------------------------------------
        # Validate file extensions
        # -----------------------------------------------------

        allowed_extensions = {
            "jpg",
            "jpeg",
            "png",
            "webp",
            "gif",
        }

        def get_extension(resource):
            filename = getattr(
                resource,
                "name",
                ""
            )

            if not filename:
                filename = str(
                    resource
                )

            extension = (
                os.path.splitext(
                    filename
                )[1]
                .lower()
                .replace(
                    ".",
                    ""
                )
            )

            return extension

        before_extension = (
            get_extension(
                before_image
            )
        )

        after_extension = (
            get_extension(
                after_image
            )
        )

        if (
            before_extension
            and before_extension
            not in allowed_extensions
        ):
            return {
                "success": False,
                "message": (
                    "Unsupported before image type. "
                    "Use JPG, JPEG, PNG, WEBP or GIF."
                )
            }, 400

        if (
            after_extension
            and after_extension
            not in allowed_extensions
        ):
            return {
                "success": False,
                "message": (
                    "Unsupported after image type. "
                    "Use JPG, JPEG, PNG, WEBP or GIF."
                )
            }, 400

        # -----------------------------------------------------
        # Calculate score BEFORE saving
        # -----------------------------------------------------

        improvement_score = (
            self.calculate_improvement_score(
                before_image,
                after_image
            )
        )

        # Reset file resources if possible.
        try:
            before_image.seek(0)
        except Exception:
            pass

        try:
            after_image.seek(0)
        except Exception:
            pass

        # -----------------------------------------------------
        # Save files
        # -----------------------------------------------------

        before_path = storage.disk(
            "local"
        ).put_file(
            "maintenance-images",
            before_image
        )

        after_path = storage.disk(
            "local"
        ).put_file(
            "maintenance-images",
            after_image
        )

        # -----------------------------------------------------
        # Create/update record
        # -----------------------------------------------------

        existing = MaintenanceImage.where(
            "maintenance_record_id",
            record.id
        ).first()

        if existing:

            existing.before_image_path = (
                before_path
            )

            existing.after_image_path = (
                after_path
            )

            existing.improvement_score = (
                improvement_score
            )

            existing.save()

            image = existing

            message = (
                "Maintenance images updated successfully."
            )

        else:

            image = MaintenanceImage.create({
                "maintenance_record_id": record.id,
                "before_image_path": before_path,
                "after_image_path": after_path,
                "improvement_score": (
                    improvement_score
                ),
            })

            message = (
                "Maintenance images uploaded successfully."
            )

        return {
            "success": True,
            "message": message,
            "data": self.image_to_dict(
                image,
                storage
            )
        }, 201