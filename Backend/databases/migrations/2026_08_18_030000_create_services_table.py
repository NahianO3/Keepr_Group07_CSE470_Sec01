"""Create Services Table.

Module 3 - Feature 4:
    Service providers can manage ... offered services.

A "service" is one specific job a provider offers (e.g. "AC Gas
Refill"), distinct from the provider's overall service_category.
A provider can offer many services.
"""

from masoniteorm.migrations import Migration


class CreateServicesTable(Migration):

    def up(self):
        with self.schema.create("services") as table:
            table.increments("id")

            table.integer("service_provider_id").unsigned()

            table.string("service_name")
            table.string("category").nullable()
            table.text("description").nullable()

            table.double("estimated_price").nullable()
            table.integer("estimated_duration_hours").nullable()

            table.foreign(
                "service_provider_id"
            ).references(
                "id"
            ).on("users").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop("services")
