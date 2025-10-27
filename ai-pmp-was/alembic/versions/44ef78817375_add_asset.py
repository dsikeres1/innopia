from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '44ef78817375'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('asset',
                    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False, comment='기본키'),
                    sa.Column('name', sa.String(), nullable=False, comment='파일명'),
                    sa.Column('content_type', sa.String(length=128), nullable=False, comment='미디어 종류 - ex) image/gif'),
                    sa.Column('uuid', sa.UUID(), nullable=False, comment='고유키'),
                    sa.Column('url', sa.String(length=512), nullable=False, comment='웹 경로'),
                    sa.Column('download_url', sa.String(length=512), nullable=False, comment='다운로드 경로'),
                    sa.PrimaryKeyConstraint('pk'),
                    sa.UniqueConstraint('uuid'),
                    comment='업로드 파일'
                    )

def downgrade() -> None:
    op.drop_table('asset')