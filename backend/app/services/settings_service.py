from app.extensions import db
from app.models import AppSettings


class SettingsService:
    """
    Organization-wide settings (a single row). `get_settings` lazily creates the
    row if it's missing so callers never get None.
    """

    @staticmethod
    def get_settings():
        settings = AppSettings.query.get(1)

        if settings is None:
            settings = AppSettings(id=1, manual_allotment=True)
            db.session.add(settings)
            db.session.commit()

        return settings

    @staticmethod
    def update_settings(data):
        settings = SettingsService.get_settings()

        if "manual_allotment" in data:
            settings.manual_allotment = data["manual_allotment"]

        db.session.commit()

        return settings

    @staticmethod
    def is_manual_allotment():
        """Convenience read for the complaint-creation flow."""
        return SettingsService.get_settings().manual_allotment
