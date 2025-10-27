from itertools import chain
from typing import List

import pytz
from flask import Flask

__all__ = ['init_app']

def dt1(datetime):
    return datetime.astimezone().strftime('%Y-%m-%d %H:%M') if datetime else ''

def dt2(datetime):
    return datetime.astimezone().strftime('%Y%m%d%H%M') if datetime else ''

def d1(datetime):
    return datetime.astimezone().strftime('%Y-%m-%d') if datetime else ''

def t1(datetime):
    return datetime.strftime('%H:%M') if datetime else ''

def d3_tz(datetime, timezone):

    return convert_timezone(datetime, timezone).strftime('%Y-%m-%d, %A') if datetime or timezone else ''

def d4_tz(datetime, timezone):
    return convert_timezone(datetime, timezone).strftime('%Y-%m-%d %H:%M') if datetime or timezone else ''

def d5(datetime):
    return datetime.strftime('%B %d, %Y') if datetime else ''

def year(datetime):
    return datetime.astimezone().strftime('%Y') if datetime else ''

def month_day(datetime):
    return datetime.astimezone().strftime('%m%d') if datetime else ''

def convert_timezone(datetime, timezone):
    return datetime.astimezone(pytz.timezone(timezone)) if datetime or timezone else ''

def yn(test):
    return 'Y' if test else 'N'

def m_ty(ty):
    return '슈퍼관리자' if ty.value == 'ADMINISTRATOR' else '일반관리자'

def number_format(value):
    return '{:,}'.format(value)

filters = {dt1, dt2, d1, t1, d3_tz, d4_tz, d5, year, month_day, yn, m_ty, number_format}

def update(*args, **kwargs):
    d = {}
    for arg in args:
        if arg:
            d.update(arg)
    d.update(**kwargs)
    return d

def classes(*args: str, **kwargs: bool) -> str:
    return ' '.join(chain(args, (k for k, v in kwargs.items() if v)))

CATEGORY = str
MESSAGE = str

def init_app(app: Flask) -> None:
    for filter_ in filters:
        app.add_template_filter(filter_)