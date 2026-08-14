"""API routes.

Routes defined here are registered under the "/api" prefix with the "api"
middleware group when the ApiProvider is enabled in config/providers.py.
"""

from masonite.routes import Route


ROUTES = [
    # User
    Route.post("/register", "UserController@register"),

    # Appliance
    Route.get("/appliances", "ApplianceController@index"),
    Route.get("/appliances/@id", "ApplianceController@show"),
    Route.post("/appliances", "ApplianceController@store"),
    Route.put("/appliances/@id", "ApplianceController@update"),
    Route.delete("/appliances/@id", "ApplianceController@destroy"),

    # Maintenance schedules
    Route.get(
        "/maintenance-schedules",
        "MaintenanceScheduleController@index"
    ),
    Route.get(
        "/maintenance-schedules/due",
        "MaintenanceScheduleController@due"
    ),
    Route.get(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@show"
    ),
    Route.post(
        "/maintenance-schedules",
        "MaintenanceScheduleController@store"
    ),
    Route.put(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@update"
    ),
    Route.delete(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@destroy"
    ),

    # Maintenance records
    Route.get(
        "/maintenance-records",
        "MaintenanceRecordController@index"
    ),
    Route.get(
        "/maintenance-records/@id",
        "MaintenanceRecordController@show"
    ),
    Route.post(
        "/maintenance-records",
        "MaintenanceRecordController@store"
    ),
    Route.put(
        "/maintenance-records/@id",
        "MaintenanceRecordController@update"
    ),
    Route.delete(
        "/maintenance-records/@id",
        "MaintenanceRecordController@destroy"
    ),
]