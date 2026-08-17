"""Create Vehicles Table."""

from masoniteorm.migrations import Migration


class CreateVehiclesTable(Migration):

    def up(self):
        with self.schema.create("vehicles") as table:
            table.increments("id")

            table.integer(
                "customer_id"
            ).unsigned()

            table.string("brand")
            table.string("model")

            table.date(
                "purchase_date"
            )

            table.double(
                "current_mileage"
            )

            table.double(
                "last_service_mileage"
            ).nullable()

            table.integer(
                "maintenance_interval_km"
            )

            table.integer(
                "maintenance_interval_days"
            )

            table.string(
                "insurance_status"
            )

            table.string(
                "registration_status"
            )

            table.string(
                "tax_token_status"
            )

            table.foreign(
                "customer_id"
            ).references(
                "id"
            ).on(
                "users"
            ).on_delete(
                "cascade"
            )

            table.timestamps()

    def down(self):
        self.schema.drop(
            "vehicles"
        )