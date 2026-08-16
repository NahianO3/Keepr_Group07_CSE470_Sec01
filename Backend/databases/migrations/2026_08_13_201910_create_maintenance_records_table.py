"""CreateMaintenanceRecordsTable Migration."""

from masoniteorm.migrations import Migration


class CreateMaintenanceRecordsTable(Migration):

    def up(self):
        with self.schema.create("maintenance_records") as table:
            table.increments("id")

            table.integer("appliance_id").unsigned()
            table.integer("service_provider_id").unsigned()

            table.date("maintenance_date")
            table.string("maintenance_type")
            table.text("work_performed")
            table.double("cost")
            table.string("status")

            table.foreign("appliance_id").references("id").on("appliances")
            table.foreign("service_provider_id").unsigned().nullable()

            table.timestamps()

    def down(self):
        self.schema.drop("maintenance_records")