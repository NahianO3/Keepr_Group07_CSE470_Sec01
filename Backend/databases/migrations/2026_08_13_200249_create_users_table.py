"""Create Users Table Migration."""

from masoniteorm.migrations import Migration


class CreateUsersTable(Migration):

    def up(self):
        with self.schema.create("users") as table:
            table.increments("id")

            # Basic account information
            table.string("full_name")
            table.string("email").unique()
            table.string("password")
            table.string("remember_token").nullable()

            table.string("phone").nullable()
            table.text("address").nullable()

            # Account / role
            table.string("role")
            table.string("account_status")

            # Password reset
            table.string("password_reset_token").nullable()
            table.datetime("password_reset_expires_at").nullable()

            # Service Provider Profile


            table.string("service_category").nullable()
            table.string("service_area").nullable()
            table.text("bio").nullable()

            table.double("hourly_rate").nullable()

            table.double("rating").nullable().default(0)
            table.integer("rating_count").nullable().default(0)
            table.integer(
                "completed_service_count"
            ).nullable().default(0)

            table.boolean(
                "is_available"
            ).nullable().default(True)

            table.text("expertise").nullable()

            table.text(
                "availability_schedule"
            ).nullable()

            table.timestamps()

    def down(self):
        self.schema.drop("users")