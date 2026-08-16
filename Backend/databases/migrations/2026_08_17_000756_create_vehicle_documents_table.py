"""Create Vehicle Documents Table."""

from masoniteorm.migrations import Migration


class CreateVehicleDocumentsTable(Migration):

    def up(self):
        with self.schema.create("vehicle_documents") as table:
            table.increments("id")

            table.integer("vehicle_id").unsigned()

            table.string("document_type")
            table.date("issue_date").nullable()
            table.date("expiry_date").nullable()

            table.string("document_status").nullable()

            table.string("document_path").nullable()

            table.foreign(
                "vehicle_id"
            ).references(
                "id"
            ).on("vehicles").on_delete("cascade")

            table.timestamps()

    def down(self):
        self.schema.drop("vehicle_documents")