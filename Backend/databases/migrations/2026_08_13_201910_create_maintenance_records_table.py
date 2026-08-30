"""Create Maintenance Records Table."""

from masoniteorm.migrations import Migration


class CreateMaintenanceRecordsTable(Migration):

    def up(self):
        with self.schema.create(
            "maintenance_records"
        ) as table:

            table.increments("id")

            table.integer(
                "appliance_id"
            ).unsigned().nullable()

            table.integer(
                "vehicle_id"
            ).unsigned().nullable()

            table.integer(
                "service_provider_id"
            ).unsigned().nullable()

            table.date(
                "maintenance_date"
            )

            table.time(
                "maintenance_time"
            ).nullable()

            # DIY or Mechanic
            table.string(
                "maintenance_type"
            )

            table.text(
                "work_performed"
            ).nullable()

            table.double(
                "cost"
            ).nullable()

            table.string(
                "status"
            )

            table.foreign(
                "appliance_id"
            ).references(
                "id"
            ).on(
                "appliances"
            ).on_delete(
                "cascade"
            )

            table.foreign(
                "vehicle_id"
            ).references(
                "id"
            ).on(
                "vehicles"
            ).on_delete(
                "cascade"
            )

            table.foreign(
                "service_provider_id"
            ).references(
                "id"
            ).on(
                "users"
            ).on_delete(
                "set null"
            )

            table.timestamps()

    def down(self):
        self.schema.drop(
            "maintenance_records"
        )