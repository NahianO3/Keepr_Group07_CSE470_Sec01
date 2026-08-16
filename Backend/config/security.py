"""Security Related Config"""

# Cross-Origin Resource Sharing
CORS = {
    "allowed_methods": [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    "allowed_origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    "allowed_headers": [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],

    "exposed_headers": [],

    "max_age": 600,

    "supports_credentials": False,
}
