"""Create Maintenance Schedules Table."""

from masoniteorm.migrations import Migration


class CreateMaintenanceSchedulesTable(Migration):

    def up(self):
        with self.schema.create(
            "maintenance_schedules"
        ) as table:

            table.increments("id")

            table.integer(
                "appliance_id"
            ).unsigned().nullable()

            table.integer(
                "vehicle_id"
            ).unsigned().nullable()

            table.date(
                "next_service_date"
            ).nullable()

            table.double(
                "next_service_mileage"
            ).nullable()

            table.integer(
                "interval_days"
            ).nullable()

            table.boolean(
                "reminder_enabled"
            ).default(True)

            table.foreign(
                "appliance_id"
            ).references(
                "id"
            ).on("appliances").on_delete("cascade")

            table.foreign(
                "vehicle_id"
            ).references(
                "id"
            ).on("vehicles").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop(
            "maintenance_schedules"
        )