from typing import TypeVar

__all__ = ['nvl']

T = TypeVar('T')

def nvl(value: T | None, default: T) -> T:
    return value if value is not None else default