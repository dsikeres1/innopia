from datetime import datetime

from sqlalchemy import String, DateTime, Text, ForeignKey, func, Index, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from was.model import Model
from was.model.asset import Asset

scene_media_category = Table(
    'scene_media_category',
    Model.metadata,
    Column('scene_media_pk', ForeignKey('scene_media.pk'), primary_key=True),
    Column('scene_category_pk', ForeignKey('scene_category.pk'), primary_key=True),
)

scene_timestamp_actor = Table(
    'scene_timestamp_actor',
    Model.metadata,
    Column('scene_timestamp_pk', ForeignKey('scene_timestamp.pk'), primary_key=True),
    Column('scene_actor_pk', ForeignKey('scene_actor.pk'), primary_key=True),
)

class SceneCategory(Model):
    __tablename__ = 'scene_category'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, comment='카테고리 이름 (Movement, Sports, Daily, ...)')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        {'comment': 'Scene - 카테고리 마스터'},
    )

class SceneActor(Model):
    __tablename__ = 'scene_actor'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, comment='배우 이름')

    image_asset_pk: Mapped[int | None] = mapped_column(ForeignKey(Asset.pk), nullable=True, comment='배우 이미지')
    image_asset: Mapped[Asset | None] = relationship()

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    timestamps: Mapped[list['SceneTimestamp']] = relationship(
        secondary=scene_timestamp_actor,
        back_populates='actors'
    )

    __table_args__ = (
        {'comment': 'Scene - 배우 마스터'},
    )

class SceneMedia(Model):
    __tablename__ = 'scene_media'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), comment='영상 제목 (예: 관상)')

    video_asset_pk: Mapped[int] = mapped_column(ForeignKey(Asset.pk), comment='영상 파일')
    thumbnail_asset_pk: Mapped[int | None] = mapped_column(ForeignKey(Asset.pk), nullable=True, comment='썸네일 이미지')

    video_asset: Mapped[Asset] = relationship(foreign_keys=[video_asset_pk])
    thumbnail_asset: Mapped[Asset | None] = relationship(foreign_keys=[thumbnail_asset_pk])

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    timestamps: Mapped[list['SceneTimestamp']] = relationship(back_populates='scene_media', cascade='all, delete-orphan')
    categories: Mapped[list[SceneCategory]] = relationship(secondary=scene_media_category, lazy='joined')

    @property
    def actors(self) -> list[SceneActor]:
        actors_dict = {}
        for ts in self.timestamps:
            for actor in ts.actors:
                actors_dict[actor.pk] = actor
        return list(actors_dict.values())

    __table_args__ = (
        {'comment': 'Scene - 영상 마스터'},
    )

class SceneTimestamp(Model):
    __tablename__ = 'scene_timestamp'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    scene_media_pk: Mapped[int] = mapped_column(ForeignKey(SceneMedia.pk), comment='영상 FK')
    scene_id: Mapped[int] = mapped_column(comment='JSON 내 scene_id')

    start_timestamp: Mapped[str] = mapped_column(String(20), comment='시작 시간 (00:00:00.00)')
    end_timestamp: Mapped[str] = mapped_column(String(20), comment='종료 시간')

    start_frame: Mapped[int] = mapped_column(comment='시작 프레임')
    end_frame: Mapped[int] = mapped_column(comment='종료 프레임')

    majority_class: Mapped[str] = mapped_column(String(100), comment='주요 클래스 (walk, dive 등)')
    category: Mapped[str] = mapped_column(String(100), comment='카테고리 (Action 등)')
    display_class: Mapped[str] = mapped_column(String(100), comment='표시 클래스 (Movement, Sports 등)')

    thumbnail_asset_pk: Mapped[int | None] = mapped_column(ForeignKey(Asset.pk), nullable=True, comment='타임스탬프 썸네일 이미지')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    scene_media: Mapped[SceneMedia] = relationship(back_populates='timestamps')
    actors: Mapped[list[SceneActor]] = relationship(
        secondary=scene_timestamp_actor,
        back_populates='timestamps'
    )
    thumbnail_asset: Mapped[Asset | None] = relationship(foreign_keys=[thumbnail_asset_pk])

    __table_args__ = (
        Index('idx_scene_timestamp_media', 'scene_media_pk'),
        Index('idx_scene_timestamp_category', 'category'),
        Index('idx_scene_timestamp_display_class', 'display_class'),
        {'comment': 'Scene - 타임스탬프 (영상 구간 정보)'},
    )