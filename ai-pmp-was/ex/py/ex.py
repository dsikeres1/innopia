from typing import Optional, TypeVar
from uuid import UUID

T = TypeVar('T')

def nullify(value: T) -> Optional[T]:
    return value if value else None

def parse_uuid(source: str | None) -> UUID | None:
    if not source:
        return None
    try:
        return UUID(source)
    except ValueError:
        return None