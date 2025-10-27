from datetime import datetime, date

from pytz import timezone
from sqlalchemy import func

tz = timezone('Asia/Seoul')

def now() -> datetime:
    return datetime.now(tz=tz)

def kst_date(field):
    return func.date(kst(field))

def kst(field):
    return func.timezone('Asia/Seoul', field)

def d1(d: date | None):
    return d.strftime('%Y-%m-%d') if d else ''

def to_time_str(hour_str):
    return f"{hour_str[:2]}:00:00"

def to_datetime(hour_str):
    time_format = "%H:%M:%S"
    hour_str = to_time_str(hour_str)
    return datetime.strptime(hour_str, time_format)

def weekday_kr(d: date):
    match d.weekday():
        case 0:
            return '월'
        case 1:
            return '화'
        case 2:
            return '수'
        case 3:
            return '목'
        case 4:
            return '금'
        case 5:
            return '토'
        case 6:
            return '일'