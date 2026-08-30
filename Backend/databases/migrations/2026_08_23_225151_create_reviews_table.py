"""Create Reviews Table."""

from masoniteorm.migrations import Migration


class CreateReviewsTable(Migration):

    def up(self):
        with self.schema.create("reviews") as table:
            table.increments("id")

            table.integer(
                "maintenance_record_id"
            ).unsigned()

            table.integer(
                "customer_id"
            ).unsigned()

            table.integer(
                "service_provider_id"
            ).unsigned()

            table.integer("rating")

            table.text("review").nullable()

            table.string(
                "moderation_status"
            ).default("visible")

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
                "customer_id"
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

            # One review per completed maintenance record
            table.unique(
                "maintenance_record_id",
                name="reviews_maintenance_record_id_unique"
            )

            table.timestamps()

    def down(self):
        self.schema.drop("reviews")