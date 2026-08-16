"""MakeServiceProviderNullable Migration."""

from masoniteorm.migrations import Migration


class MakeServiceProviderNullable(Migration):
    def up(self):
        """
        Run the migrations.
        """
        with self.schema.table("maintenance_records") as table:
            pass

    def down(self):
        """
        Revert the migrations.
        """
        with self.schema.table("maintenance_records") as table:
            pass
