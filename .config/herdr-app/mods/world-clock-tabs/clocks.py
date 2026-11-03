"""Read all toolbar clocks at the same instant using the system timezone database."""

import json
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def clock_values(zones, now=None):
    now = now or datetime.now(timezone.utc)
    clocks = {}
    for zone in zones:
        local = now.astimezone(ZoneInfo(zone))
        offset = local.strftime("%z")
        clocks[zone] = {
            "time": local.strftime("%H:%M"),
            # A simple local-hours indicator, not an astronomical sunrise lookup.
            "is_day": 6 <= local.hour < 18,
            "date": local.strftime("%a, %d %b %Y"),
            "abbreviation": local.tzname(),
            "offset": f"{offset[:3]}:{offset[3:]}",
        }
    return clocks


if __name__ == "__main__":
    print(json.dumps(clock_values(sys.argv[1:])))
