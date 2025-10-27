from hashlib import sha3_512

def hash_password(base_salt: bytes, password: str) -> str:
    m = sha3_512()

    m.update(base_salt)
    m.update(password.encode('utf-8'))
    m.update(base_salt)

    return m.hexdigest()