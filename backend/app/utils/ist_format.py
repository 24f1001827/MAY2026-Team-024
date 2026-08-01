from zoneinfo import ZoneInfo
from datetime import timezone

def format_ist(utc_dt):
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    ist_dt = utc_dt.astimezone(ZoneInfo("Asia/Kolkata"))
    return ist_dt.strftime("%B %d, %Y, %I:%M %p")