import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Callable
from uuid import UUID

from faker import Faker

from ex.faker_ex import faker_call, faker_unique
from ex.py.lorem_picsum import LoremPicsumJar
from was.application import app
from was.model import db
from was.model.asset import Asset
from was.model.user import User

def main() -> None:
    importers: list[Callable[[Faker], None]] = [
        _import_user,

    ]

    for importer in importers:
        with app.app_context():
            print(f'import {importer.__name__.removeprefix("_import_")} ... ', flush=True, end='')
            faker = Faker()
            faker.seed_instance(importer.__name__)
            importer(faker)
            print(f'done')

def _import_user(faker: Faker) -> None:
    def new_user() -> User:
        user = User()
        return user

    users = faker_call(faker, new_user, 20)
    db.session.add_all(users)
    db.session.commit()

_lorem_picsum_jar = LoremPicsumJar()

def new_asset() -> Asset:
    index, picsum = _lorem_picsum_jar.next()
    uuid = UUID(int=index)
    asset = Asset(
        name=picsum.id + '.jpg',
        content_type='image/jpeg',
        uuid=uuid,
        url=picsum.download_url + '.jpg',
        download_url=picsum.download_url + '.jpg',
    )
    return asset

def new_assets(n: int) -> list[Asset]:
    return [new_asset() for _ in range(n)]

def new_asset_uuid() -> UUID:
    return new_asset().uuid

def new_asset_uuids(n: int) -> list[UUID]:
    return [new_asset_uuid() for _ in range(n)]

if __name__ == '__main__':
    main()