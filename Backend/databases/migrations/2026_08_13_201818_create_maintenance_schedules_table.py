"""Create Maintenance Schedules Table Migration."""

from masoniteorm.migrations import Migration


class CreateMaintenanceSchedulesTable(Migration):

    def up(self):
        """Run the migrations."""

        with self.schema.create("maintenance_schedules") as table:
            table.increments("id")

            table.integer("appliance_id")

            table.date("next_service_date")

            table.double("next_service_mileage").nullable()

            table.integer("interval_days")

            table.boolean("reminder_enabled").default(True)

            table.timestamps()

            table.foreign("appliance_id").references("id").on("appliances")

            table.unique(
                "appliance_id",
                name="maintenance_schedules_appliance_id_unique"
            )

    def down(self):
        """Reverse the migrations."""

        self.schema.drop("maintenance_schedules")