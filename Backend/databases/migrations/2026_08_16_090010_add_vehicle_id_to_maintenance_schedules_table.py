"""AddVehicleIdToMaintenanceSchedulesTable Migration.

A maintenance schedule now belongs to EITHER an appliance OR a vehicle,
never both at the same time (the same XOR pattern used elsewhere in the
system, e.g. Booking -> Appliance/Vehicle). appliance_id is relaxed to
nullable and a nullable vehicle_id is introduced.
"""

from masoniteorm.migrations import Migration


class AddVehicleIdToMaintenanceSchedulesTable(Migration):

    def up(self):
        with self.schema.table("maintenance_schedules") as table:
            table.integer("appliance_id").unsigned().nullable().change()

            table.integer("vehicle_id").unsigned().nullable()

        with self.schema.table("maintenance_schedules") as table:
            table.foreign("vehicle_id").references("id").on("vehicles")

            table.unique(
                "vehicle_id",
                name="maintenance_schedules_vehicle_id_unique",
            )

    def down(self):
        with self.schema.table("maintenance_schedules") as table:
            table.drop_unique("maintenance_schedules_vehicle_id_unique")
            table.drop_foreign("vehicle_id")
            table.drop_column("vehicle_id")

            table.integer("appliance_id").unsigned().change()
