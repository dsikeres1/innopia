from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f18bafff6911'
down_revision: Union[str, None] = 'e9cd30caa6af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('pattern_program',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name_ko', sa.String(length=200), nullable=False, comment='한글 프로그램명'),
    sa.Column('name_en', sa.String(length=200), nullable=False, comment='영문 프로그램명'),
    sa.Column('genre_ko', sa.String(length=50), nullable=False, comment='한글 장르'),
    sa.Column('genre_en', sa.String(length=50), nullable=False, comment='영문 장르'),
    sa.Column('asset_pk', sa.Integer(), nullable=True, comment='썸네일 (없으면 같은 장르에서 랜덤 선택)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['asset_pk'], ['asset.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    sa.UniqueConstraint('name_en'),
    sa.UniqueConstraint('name_ko'),
    comment='Pattern - 프로그램 마스터'
    )

    op.create_table('pattern_tv_schedule',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('day_of_week', sa.String(length=20), nullable=False, comment='월요일, 화요일, ...'),
    sa.Column('time', sa.String(length=10), nullable=False, comment='HH:MM'),
    sa.Column('channel', sa.String(length=20), nullable=False, comment='채널1, 채널2, ...'),
    sa.Column('program_pk', sa.Integer(), nullable=False),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['program_pk'], ['pattern_program.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='Pattern - TV 채널 편성표'
    )
    op.create_table('pattern_tv_viewing_log',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_pk', sa.Integer(), nullable=False),
    sa.Column('program_pk', sa.Integer(), nullable=False),
    sa.Column('quarter', sa.String(length=10), nullable=False, comment='Q1, Q2, Q3, Q4'),
    sa.Column('view_date', sa.Date(), nullable=False, comment='시청 날짜'),
    sa.Column('view_time', sa.String(length=10), nullable=False, comment='시청 시간 HH:MM'),
    sa.Column('day', sa.String(length=20), nullable=False, comment='요일'),
    sa.Column('channel', sa.String(length=20), nullable=False, comment='채널'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['program_pk'], ['pattern_program.pk'], ),
    sa.ForeignKeyConstraint(['user_pk'], ['user.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='Pattern - TV 시청 기록'
    )

def downgrade() -> None:

    op.drop_table('pattern_tv_viewing_log')
    op.drop_table('pattern_tv_schedule')
    op.drop_table('pattern_program')