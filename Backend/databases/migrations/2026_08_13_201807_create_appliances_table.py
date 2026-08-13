"""CreateAppliancesTable Migration."""

from masoniteorm.migrations import Migration


class CreateAppliancesTable(Migration):

    def up(self):
        with self.schema.create("appliances") as table:
            table.increments("id")

            table.integer("customer_id").unsigned()
            table.string("category")
            table.string("name")
            table.date("purchase_date")
            table.date("warranty_expiry")
            table.integer("maintenance_interval")
            table.string("condition")

            table.foreign("customer_id").references("id").on("users").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop("appliances")