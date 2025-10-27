import uuid as py_uuid
from typing import Union, IO, List, Optional
from urllib.parse import quote

import boto3
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.datastructures import FileStorage

from ex.api import BaseModel
from was import config
from was.model import Model, db

class Asset(Model):
    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment='기본키')
    name: Mapped[str] = mapped_column(String(), nullable=False, comment='파일명')
    content_type: Mapped[str] = mapped_column(String(128), nullable=False, comment='미디어 종류 - ex) image/gif')
    uuid: 'Mapped[py_uuid.UUID]' = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, comment='고유키')
    url: Mapped[str] = mapped_column(String(512), nullable=False, comment='웹 경로')
    download_url: Mapped[str] = mapped_column(String(512), nullable=False, comment='다운로드 경로')

    __table_args__ = ({'comment': '업로드 파일'},)

    @classmethod
    def new_(cls, name, content_type, file: Union[IO[bytes], FileStorage]):
        asset_uuid = py_uuid.uuid4()

        object_name: str = config.R2_BUCKET_ASSET_PREFIX + '/' + str(asset_uuid) + '/' + name
        object_name = object_name.removeprefix('/')

        path_parts = object_name.rsplit('/', 1)
        encoded_filename = quote(path_parts[1], safe='')
        encoded_object_name = f'{path_parts[0]}/{encoded_filename}'

        asset = Asset()
        asset.name = name
        asset.content_type = content_type
        asset.uuid = asset_uuid
        asset.url = f'{config.R2_ASSET_BASE_URL}/{encoded_object_name}'
        asset.download_url = f'{config.R2_ASSET_BASE_URL}/{encoded_object_name}'

        boto3.client(
            's3',
            aws_access_key_id=config.R2_ACCESS_KEY_ID,
            aws_secret_access_key=config.R2_SECRET_ACCESS_KEY,
            endpoint_url=config.R2_ENDPOINT_URL,
            region_name=config.R2_REGION
        ).upload_fileobj(
            file, config.R2_BUCKET, object_name, ExtraArgs={'ContentType': content_type}
        )
        return asset

    @classmethod
    def _from_uuids(cls, uuids: List[py_uuid.UUID]) -> List['Asset']:
        if not uuids:
            return []

        assets = db.session.execute(db.select(cls).filter(cls.uuid.in_(uuids))).scalars()

        def asset_key(asset: Asset) -> int:
            for (index, uuid) in enumerate(uuids):
                if uuid == asset.uuid:
                    return index
            raise IndexError('cannot find uuid from assets')

        assets.sort(key=asset_key)
        return assets

    @classmethod
    def from_uuid(cls, uuid_: py_uuid.UUID) -> Optional['Asset']:
        return db.session.execute(db.select(cls).filter(cls.uuid == uuid_)).scalar_one_or_none()

    class Bsset(BaseModel):
        uuid: py_uuid.UUID
        name: str
        url: str
        download_url: str
        content_type: str

    def to_bsset(self) -> Bsset:
        return Asset.Bsset(
            uuid=self.uuid, name=self.name, url=self.url,
            download_url=self.download_url,
            content_type=self.content_type,
        )