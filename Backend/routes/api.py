"""API routes.

Routes defined here are registered under the "/api" prefix with the "api"
middleware group when the ApiProvider is enabled in config/providers.py.
"""

from masonite.routes import Route



ROUTES = [
    # User
    Route.post("/register", "UserController@register"),

    # Appliance
    Route.get(
        "/appliances",
        "ApplianceController@index"
    ).middleware("role:customer"),

    Route.get(
        "/appliances/warranty-due",
        "ApplianceController@warranty_due"
    ).middleware("role:customer"),

    Route.get(
        "/appliances/@id",
        "ApplianceController@show"
    ).middleware("role:customer"),

    Route.post(
        "/appliances",
        "ApplianceController@store"
    ).middleware("role:customer"),

    Route.put(
        "/appliances/@id",
        "ApplianceController@update"
    ).middleware("role:customer"),

    Route.delete(
        "/appliances/@id",
        "ApplianceController@destroy"
    ).middleware("role:customer"),

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
    Route.post(
        "/maintenance-records/@id/complete",
        "MaintenanceRecordController@complete"
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