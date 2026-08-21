"""Add Service Provider Profile Fields To Users Table."""

from masoniteorm.migrations import Migration


class AddProviderProfileFieldsToUsersTable(Migration):

    def up(self):
        with self.schema.table("users") as table:

            table.string("service_category").nullable()
            table.string("service_area").nullable()
            table.text("bio").nullable()

            table.double("hourly_rate").nullable()

            table.double("rating").nullable().default(0)
            table.integer("rating_count").nullable().default(0)
            table.integer("completed_service_count").nullable().default(0)

            table.boolean("is_available").nullable().default(True)

    def down(self):
        with self.schema.table("users") as table:
            table.drop_column(
                "service_category",
                "service_area",
                "bio",
                "hourly_rate",
                "rating",
                "rating_count",
                "completed_service_count",
                "is_available",
            )