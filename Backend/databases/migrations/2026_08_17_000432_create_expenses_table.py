"""Create Expenses Table."""

from masoniteorm.migrations import Migration


class CreateExpensesTable(Migration):

    def up(self):
        with self.schema.create("expenses") as table:
            table.increments("id")

            table.integer("maintenance_record_id").unsigned()

            table.double("amount")
            table.string("expense_category")
            table.date("expense_date")
            table.text("description").nullable()

            table.foreign(
                "maintenance_record_id"
            ).references(
                "id"
            ).on("maintenance_records").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop("expenses")