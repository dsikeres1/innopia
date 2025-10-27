import re

def is_blank(s: str | None) -> bool:
    if s is None:
        return True
    return not bool(s.strip())

def is_not_blank(s: str | None) -> bool:
    return not is_blank(s)

def format_phone(phone: int | str) -> str:
    if not re.match(r'^\d{11}$', str(phone)):
        raise ValueError('Invalid phone number format')

    return re.sub(r'(\d{3})(\d{4})(\d{4})', r'\1-\2-\3', str(phone))