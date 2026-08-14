from app.models.User import User


GUARDS = {
    "default": "web",

    "web": {
        "model": User,
    },

    "api": {
        "model": User,
    },

    # Password reset token lifetime in minutes
    "password_reset_expiration": 1440,
}