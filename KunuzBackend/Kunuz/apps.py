from django.apps import AppConfig


class KunuzConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "kunuz"

    def ready(self):
        import kunuz.signals
