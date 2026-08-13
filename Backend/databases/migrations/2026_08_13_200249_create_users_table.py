"""CreateUsersTable Migration."""

from masoniteorm.migrations import Migration


class CreateUsersTable(Migration):

    def up(self):
        with self.schema.create("users") as table:
            table.increments("id")

            table.string("full_name")
            table.string("email").unique()
            table.string("password")

            table.string("phone").nullable()
            table.text("address").nullable()

            table.string("role")
            table.string("account_status")

            table.timestamps()

    def down(self):
        self.schema.drop("users")