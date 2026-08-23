"""Create Reports Table."""

from masoniteorm.migrations import Migration


class CreateReportsTable(Migration):

    def up(self):
        with self.schema.create("reports") as table:
            table.increments("id")

            table.integer(
                "maintenance_record_id"
            ).unsigned()

            table.integer(
                "reporter_id"
            ).unsigned()

            table.integer(
                "service_provider_id"
            ).unsigned()

            table.string("reason")

            table.text("description").nullable()

            table.string(
                "status"
            ).default("Pending")

            table.foreign(
                "maintenance_record_id"
            ).references(
                "id"
            ).on(
                "maintenance_records"
            ).on_delete(
                "cascade"
            )

            table.foreign(
                "reporter_id"
            ).references(
                "id"
            ).on(
                "users"
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
                "cascade"
            )

            # A customer can report the same
            # maintenance record only once
            table.unique(
                [
                    "maintenance_record_id",
                    "reporter_id",
                ],
                name="reports_record_reporter_unique"
            )

            table.timestamps()

    def down(self):
        self.schema.drop("reports")