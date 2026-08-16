"""Make service_provider_id nullable."""

from masoniteorm.migrations import Migration


class MakeServiceProviderNullable(Migration):

    def up(self):
        with self.schema.table("maintenance_records") as table:
            table.integer("service_provider_id").unsigned().nullable().change()

    def down(self):
        with self.schema.table("maintenance_records") as table:
            table.integer("service_provider_id").unsigned().change()