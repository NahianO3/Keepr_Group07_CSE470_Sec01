"""CreateMaintenanceSchedulesTable Migration."""

from masoniteorm.migrations import Migration


class CreateMaintenanceSchedulesTable(Migration):

    def up(self):
        with self.schema.create("maintenance_schedules") as table:
            table.increments("id")

            table.integer("appliance_id").unsigned()
            table.date("next_service_date")
            table.double("next_service_mileage").nullable()
            table.integer("interval_days")
            table.boolean("reminder_enabled")

            table.foreign("appliance_id").references("id").on("appliances").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop("maintenance_schedules")