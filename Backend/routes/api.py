"""API routes.

Routes defined here are registered under the "/api" prefix with the "api"
middleware group when the ApiProvider is enabled in config/providers.py.
"""

from masonite.routes import Route

ROUTES = [
    Route.post("/register", "UserController@register"),

    Route.get("/appliances", "ApplianceController@index"),
    Route.get("/appliances/@id", "ApplianceController@show"),
    Route.post("/appliances", "ApplianceController@store"),
    Route.put("/appliances/@id", "ApplianceController@update"),
    Route.delete("/appliances/@id", "ApplianceController@destroy"),
]