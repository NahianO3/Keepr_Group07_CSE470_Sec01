"""Create Maintenance Images Table."""

from masoniteorm.migrations import Migration


class CreateMaintenanceImagesTable(Migration):

    def up(self):
        with self.schema.create(
            "maintenance_images"
        ) as table:

            table.increments("id")

            table.integer(
                "maintenance_record_id"
            ).unsigned()

            table.string(
                "before_image_path"
            ).nullable()

            table.string(
                "after_image_path"
            ).nullable()

            table.double(
                "improvement_score"
            ).nullable()

            table.foreign(
                "maintenance_record_id"
            ).references(
                "id"
            ).on(
                "maintenance_records"
            ).on_delete(
                "cascade"
            )

            # One before/after image set per
            # maintenance record.
            table.unique(
                "maintenance_record_id",
                name=(
                    "maintenance_images_record_unique"
                )
            )

            table.timestamps()

    def down(self):
        self.schema.drop(
            "maintenance_images"
        )