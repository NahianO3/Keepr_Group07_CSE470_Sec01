"""API routes.

Routes defined here are registered under the "/api" prefix.
"""

from masonite.routes import Route


ROUTES = [

    # =========================
    # User
    # =========================

    Route.post(
        "/register",
        "UserController@register",
    ),

    # Authentication


    Route.post(
        "/logout",
        "AuthenticationController@logout",
    ),

    Route.post(
        "/password-reset/request",
        "AuthenticationController@password_reset_request",
    ),

    Route.post(
        "/password-reset/confirm",
        "AuthenticationController@password_reset_confirm",
    ),

    # =========================
    # Customer - Appliances
    # =========================

    Route.get(
        "/appliances",
        "ApplianceController@index",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/appliances/warranty-due",
        "ApplianceController@warranty_due",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/appliances/@id",
        "ApplianceController@show",
    ).middleware("api_auth", "role:customer"),

    Route.post(
        "/appliances",
        "ApplianceController@store",
    ).middleware("api_auth", "role:customer"),

    Route.put(
        "/appliances/@id",
        "ApplianceController@update",
    ).middleware("api_auth", "role:customer"),

    Route.delete(
        "/appliances/@id",
        "ApplianceController@destroy",
    ).middleware("api_auth", "role:customer"),

    # =========================
    # Customer - Vehicles
    # =========================

    Route.get(
        "/vehicles",
        "VehicleController@index",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/vehicles/@id",
        "VehicleController@show",
    ).middleware("api_auth", "role:customer"),

    Route.post(
        "/vehicles",
        "VehicleController@store",
    ).middleware("api_auth", "role:customer"),

    Route.put(
        "/vehicles/@id",
        "VehicleController@update",
    ).middleware("api_auth", "role:customer"),

    Route.put(
        "/vehicles/@id/mileage",
        "VehicleController@update_mileage",
    ).middleware("api_auth", "role:customer"),

    Route.delete(
        "/vehicles/@id",
        "VehicleController@destroy",
    ).middleware("api_auth", "role:customer"),

    # =========================
    # Customer - Maintenance Schedules
    # (shared by Appliances and Vehicles - a schedule is linked to
    # EITHER an appliance OR a vehicle, never both)
    # =========================

    Route.get(
        "/maintenance-schedules",
        "MaintenanceScheduleController@index",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/maintenance-schedules/due",
        "MaintenanceScheduleController@due",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@show",
    ).middleware("api_auth", "role:customer"),

    Route.post(
        "/maintenance-schedules",
        "MaintenanceScheduleController@store",
    ).middleware("api_auth", "role:customer"),

    Route.put(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@update",
    ).middleware("api_auth", "role:customer"),

    Route.delete(
        "/maintenance-schedules/@id",
        "MaintenanceScheduleController@destroy",
    ).middleware("api_auth", "role:customer"),

    # =========================
    # Customer - Maintenance Records
    # =========================
    Route.get(
       "/maintenance-records/diy",
       "MaintenanceRecordController@diy_records",
    ).middleware("api_auth", "role:customer"),

    Route.get(
       "/maintenance-records/mechanic",
       "MaintenanceRecordController@mechanic_records",
    ).middleware("api_auth", "role:customer"),
 

    Route.get(
        "/maintenance-records",
        "MaintenanceRecordController@index",
    ).middleware("api_auth", "role:customer"),

    Route.get(
        "/maintenance-records/@id",
        "MaintenanceRecordController@show",
    ).middleware("api_auth", "role:customer"),
 
    Route.post(
        "/maintenance-records",
        "MaintenanceRecordController@store",
    ).middleware("api_auth", "role:customer"),

    Route.put(
        "/maintenance-records/@id",
        "MaintenanceRecordController@update",
    ).middleware("api_auth", "role:customer"),

    Route.delete(
        "/maintenance-records/@id",
        "MaintenanceRecordController@destroy",
    ).middleware("api_auth", "role:customer"),

    # =========================
    # Service Provider
    # =========================

    Route.get(
        "/maintenance-requests",
        "MaintenanceRecordController@provider_requests",
    ).middleware("api_auth", "role:service_provider"),

    Route.post(
        "/maintenance-records/@id/accept",
        "MaintenanceRecordController@accept",
    ).middleware("api_auth", "role:service_provider"),

    Route.post(
        "/maintenance-records/@id/reject",
        "MaintenanceRecordController@reject",
    ).middleware("api_auth", "role:service_provider"),

    Route.put(
        "/maintenance-records/@id/reschedule",
        "MaintenanceRecordController@reschedule",
    ).middleware("api_auth", "role:service_provider"),

    Route.put(
        "/maintenance-records/@id/progress",
        "MaintenanceRecordController@update_progress",
    ).middleware("api_auth", "role:service_provider"),

    Route.post(
        "/maintenance-records/@id/complete",
        "MaintenanceRecordController@complete",
    ).middleware("api_auth", "role:service_provider"),

    # =========================
    # Administrator
    # =========================

    Route.get(
        "/admin/users",
        "AdminController@users",
    ).middleware("api_auth", "role:admin"),

    Route.put(
        "/admin/users/@id/status",
        "AdminController@update_user_status",
    ).middleware("api_auth", "role:admin"),

    Route.put(
        "/admin/providers/@id/approve",
        "AdminController@approve_provider",
    ).middleware("api_auth", "role:admin"),

    Route.get(
        "/admin/maintenance-records",
        "AdminController@maintenance_records",
    ).middleware("api_auth", "role:admin"),
]