"""CreateMaintenanceImagesTable Migration."""

from masoniteorm.migrations import Migration


class CreateMaintenanceImagesTable(Migration):
    def up(self):
        """
        Run the migrations.
        """
        with self.schema.create("maintenance_images") as table:
            table.increments("id")

            table.timestamps()

    def down(self):
        """
        Revert the migrations.
        """
        self.schema.drop("maintenance_images")
