from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a3f5b91cb5fd'
down_revision: Union[str, None] = 'f18bafff6911'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:

    op.create_table('scene_category',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False, comment='카테고리 이름 (Movement, Sports, Daily, ...)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('pk'),
    sa.UniqueConstraint('name'),
    comment='Scene - 카테고리 마스터'
    )
    op.create_table('scene_actor',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False, comment='배우 이름'),
    sa.Column('image_asset_pk', sa.Integer(), nullable=True, comment='배우 이미지'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['image_asset_pk'], ['asset.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    sa.UniqueConstraint('name'),
    comment='Scene - 배우 마스터'
    )
    op.create_table('scene_media',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('title', sa.String(length=500), nullable=False, comment='영상 제목 (예: 관상)'),
    sa.Column('video_asset_pk', sa.Integer(), nullable=False, comment='영상 파일'),
    sa.Column('thumbnail_asset_pk', sa.Integer(), nullable=True, comment='썸네일 이미지'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['thumbnail_asset_pk'], ['asset.pk'], ),
    sa.ForeignKeyConstraint(['video_asset_pk'], ['asset.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='Scene - 영상 마스터'
    )
    op.create_table('scene_media_category',
    sa.Column('scene_media_pk', sa.Integer(), nullable=False),
    sa.Column('scene_category_pk', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['scene_category_pk'], ['scene_category.pk'], ),
    sa.ForeignKeyConstraint(['scene_media_pk'], ['scene_media.pk'], ),
    sa.PrimaryKeyConstraint('scene_media_pk', 'scene_category_pk')
    )
    op.create_table('scene_timestamp',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('scene_media_pk', sa.Integer(), nullable=False, comment='영상 FK'),
    sa.Column('scene_id', sa.Integer(), nullable=False, comment='JSON 내 scene_id'),
    sa.Column('start_timestamp', sa.String(length=20), nullable=False, comment='시작 시간 (00:00:00.00)'),
    sa.Column('end_timestamp', sa.String(length=20), nullable=False, comment='종료 시간'),
    sa.Column('start_frame', sa.Integer(), nullable=False, comment='시작 프레임'),
    sa.Column('end_frame', sa.Integer(), nullable=False, comment='종료 프레임'),
    sa.Column('majority_class', sa.String(length=100), nullable=False, comment='주요 클래스 (walk, dive 등)'),
    sa.Column('category', sa.String(length=100), nullable=False, comment='카테고리 (Action 등)'),
    sa.Column('display_class', sa.String(length=100), nullable=False, comment='표시 클래스 (Movement, Sports 등)'),
    sa.Column('actor_pk', sa.Integer(), nullable=True, comment='배우 FK'),
    sa.Column('thumbnail_asset_pk', sa.Integer(), nullable=True, comment='타임스탬프 썸네일 이미지'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['actor_pk'], ['scene_actor.pk'], ),
    sa.ForeignKeyConstraint(['scene_media_pk'], ['scene_media.pk'], ),
    sa.ForeignKeyConstraint(['thumbnail_asset_pk'], ['asset.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='Scene - 타임스탬프 (영상 구간 정보)'
    )
    op.create_index('idx_scene_timestamp_actor', 'scene_timestamp', ['actor_pk'], unique=False)
    op.create_index('idx_scene_timestamp_category', 'scene_timestamp', ['category'], unique=False)
    op.create_index('idx_scene_timestamp_display_class', 'scene_timestamp', ['display_class'], unique=False)
    op.create_index('idx_scene_timestamp_media', 'scene_timestamp', ['scene_media_pk'], unique=False)

def downgrade() -> None:

    op.drop_index('idx_scene_timestamp_media', table_name='scene_timestamp')
    op.drop_index('idx_scene_timestamp_display_class', table_name='scene_timestamp')
    op.drop_index('idx_scene_timestamp_category', table_name='scene_timestamp')
    op.drop_index('idx_scene_timestamp_actor', table_name='scene_timestamp')
    op.drop_table('scene_timestamp')
    op.drop_table('scene_media_category')
    op.drop_table('scene_media')
    op.drop_table('scene_actor')
    op.drop_table('scene_category')