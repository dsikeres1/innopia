from sqlalchemy.orm import joinedload

from ex.api import BaseModel, Res, ok
from ex.flask_ex import not_found
from was.blueprints.front import app
from was.model import db
from was.model.scene import SceneMedia, SceneTimestamp, SceneActor, SceneCategory
from was import config

class SceneListReq(BaseModel):
    category: str | None = None

class ActorInfo(BaseModel):
    name: str
    image_url: str | None

class SceneMediaInfo(BaseModel):
    pk: int
    title: str
    video_url: str
    thumbnail_url: str | None
    categories: list[str]
    actors: list[ActorInfo]

class SceneListRes(BaseModel):
    scenes: list[SceneMediaInfo]

    @classmethod
    def from_model(cls, media: SceneMedia) -> 'SceneMediaInfo':
        return SceneMediaInfo(
            pk=media.pk,
            title=media.title,
            video_url=media.video_asset.url,
            thumbnail_url=media.thumbnail_asset.url if media.thumbnail_asset else None,
            categories=[cat.name for cat in media.categories],
            actors=[
                ActorInfo(
                    name=actor.name,
                    image_url=actor.image_asset.url if actor.image_asset else None
                )
                for actor in media.actors
            ]
        )

@app.api()
def scene_list(req: SceneListReq) -> Res[SceneListRes]:
    q = db.select(SceneMedia).options(
        joinedload(SceneMedia.video_asset),
        joinedload(SceneMedia.thumbnail_asset),
        joinedload(SceneMedia.timestamps).joinedload(SceneTimestamp.actors).joinedload(SceneActor.image_asset)
    )

    if req.category:
        q = q.join(SceneMedia.categories).filter(
            SceneCategory.name == req.category
        ).distinct()

    q = q.order_by(SceneMedia.title.collate(config.DB_COLLNAME))

    medias = list(db.session.execute(q).scalars().unique())

    return ok(SceneListRes(
        scenes=[SceneListRes.from_model(m) for m in medias]
    ))

class SceneDetailReq(BaseModel):
    scene_media_pk: int

class SceneTimestampInfo(BaseModel):
    pk: int
    scene_id: int
    start_timestamp: str
    end_timestamp: str
    start_frame: int
    end_frame: int
    majority_class: str
    category: str
    display_class: str
    actors: list[ActorInfo]
    thumbnail_url: str | None

class SceneDetailRes(BaseModel):
    pk: int
    title: str
    video_url: str
    timestamps: list[SceneTimestampInfo]

    @classmethod
    def timestamp_from_model(cls, ts: SceneTimestamp) -> 'SceneTimestampInfo':
        return SceneTimestampInfo(
            pk=ts.pk,
            scene_id=ts.scene_id,
            start_timestamp=ts.start_timestamp,
            end_timestamp=ts.end_timestamp,
            start_frame=ts.start_frame,
            end_frame=ts.end_frame,
            majority_class=ts.majority_class,
            category=ts.category,
            display_class=ts.display_class,
            actors=[
                ActorInfo(
                    name=actor.name,
                    image_url=actor.image_asset.url if actor.image_asset else None
                )
                for actor in ts.actors
            ],
            thumbnail_url=ts.thumbnail_asset.url if ts.thumbnail_asset else None
        )

@app.api()
def scene_detail(req: SceneDetailReq) -> Res[SceneDetailRes]:
    q = db.select(SceneMedia).options(
        joinedload(SceneMedia.video_asset),
        joinedload(SceneMedia.timestamps).joinedload(SceneTimestamp.actors).joinedload(SceneActor.image_asset),
        joinedload(SceneMedia.timestamps).joinedload(SceneTimestamp.thumbnail_asset)
    ).filter(SceneMedia.pk == req.scene_media_pk)

    media = db.session.execute(q).scalars().unique().one_or_none()
    if not media:
        return not_found()

    sorted_timestamps = sorted(media.timestamps, key=lambda ts: ts.start_frame)

    return ok(SceneDetailRes(
        pk=media.pk,
        title=media.title,
        video_url=media.video_asset.url,
        timestamps=[SceneDetailRes.timestamp_from_model(ts) for ts in sorted_timestamps]
    ))

class SceneCategoryInfo(BaseModel):
    name: str

class SceneCategoryListReq(BaseModel):
    pass

class SceneCategoryListRes(BaseModel):
    categories: list[SceneCategoryInfo]

@app.api()
def scene_category_list(req: SceneCategoryListReq) -> Res[SceneCategoryListRes]:
    categories = db.session.execute(
        db.select(SceneCategory.name).distinct().order_by(SceneCategory.name)
    ).scalars().all()

    return ok(SceneCategoryListRes(
        categories=[SceneCategoryInfo(name=cat) for cat in categories]
    ))

class SceneActorInfo(BaseModel):
    pk: int
    name: str
    image_url: str | None

class SceneActorListReq(BaseModel):
    category: str | None = None

class SceneActorListRes(BaseModel):
    actors: list[SceneActorInfo]

@app.api()
def scene_actor_list(req: SceneActorListReq) -> Res[SceneActorListRes]:
    q = db.select(SceneActor).options(
        joinedload(SceneActor.image_asset)
    )

    if req.category:
        q = q.join(SceneActor.timestamps).filter(
            SceneTimestamp.display_class == req.category
        ).distinct()

    q = q.order_by(SceneActor.name.collate(config.DB_COLLNAME))

    actors = list(db.session.execute(q).scalars().unique())

    return ok(SceneActorListRes(
        actors=[
            SceneActorInfo(
                pk=actor.pk,
                name=actor.name,
                image_url=actor.image_asset.url if actor.image_asset else None
            )
            for actor in actors
        ]
    ))

class SceneChatbotFilterReq(BaseModel):
    category: str | None = None
    actor_name: str | None = None

class SceneChatbotFilterRes(BaseModel):
    scenes: list[SceneMediaInfo]

@app.api()
def scene_chatbot_filter(req: SceneChatbotFilterReq) -> Res[SceneChatbotFilterRes]:
    q = db.select(SceneMedia).options(
        joinedload(SceneMedia.video_asset),
        joinedload(SceneMedia.thumbnail_asset),
        joinedload(SceneMedia.timestamps).joinedload(SceneTimestamp.actors).joinedload(SceneActor.image_asset)
    )

    filters = []

    if req.category:
        q = q.join(SceneMedia.categories)
        filters.append(SceneCategory.name == req.category)

    if req.actor_name:
        q = q.join(SceneMedia.timestamps).join(SceneTimestamp.actors)
        filters.append(SceneActor.name == req.actor_name)

    if filters:
        q = q.filter(db.and_(*filters)).distinct()

    q = q.order_by(SceneMedia.title.collate(config.DB_COLLNAME))

    medias = list(db.session.execute(q).scalars().unique())

    return ok(SceneChatbotFilterRes(
        scenes=[SceneListRes.from_model(m) for m in medias]
    ))