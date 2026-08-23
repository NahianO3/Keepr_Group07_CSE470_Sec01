"""Create Bookmarks Table."""

from masoniteorm.migrations import Migration


class CreateBookmarksTable(Migration):

    def up(self):
        with self.schema.create("bookmarks") as table:
            table.increments("id")

            table.integer(
                "customer_id"
            ).unsigned()

            table.integer(
                "service_provider_id"
            ).unsigned()

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

            # A customer can bookmark a provider only once
            table.unique(
                [
                    "customer_id",
                    "service_provider_id",
                ],
                name="bookmarks_customer_provider_unique"
            )

            table.timestamps()

    def down(self):
        self.schema.drop("bookmarks")