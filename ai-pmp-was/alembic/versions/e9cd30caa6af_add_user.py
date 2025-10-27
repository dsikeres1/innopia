from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e9cd30caa6af'
down_revision: Union[str, None] = '44ef78817375'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('user',
                    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False, comment='CSV userId (1-100)'),
                    sa.Column('gender', sa.String(length=20), nullable=False, comment='Female/Male'),
                    sa.Column('age', sa.String(length=20), nullable=False, comment='1-17, 18-24, 25-34, 35-44, 45-49, 50-55, 56+'),
                    sa.Column('occupation', sa.String(length=100), nullable=False, comment='K-12 student, Programmer, etc.'),
                    sa.Column('zip', sa.String(length=20), nullable=False, comment='우편번호'),
                    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
                    sa.PrimaryKeyConstraint('pk'),
                    comment='유저'
                    )
    op.create_table('user_authentication',
                    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
                    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
                    sa.Column('update_at', sa.DateTime(timezone=True), nullable=True),
                    sa.Column('sign_out', sa.Boolean(), nullable=False, comment='로그아웃 여부'),
                    sa.Column('user_pk', sa.Integer(), nullable=False),
                    sa.Column('access_token', sa.UUID(), nullable=False),
                    sa.Column('expire_at', sa.DateTime(timezone=True), nullable=False),
                    sa.ForeignKeyConstraint(['user_pk'], ['user.pk'], ),
                    sa.PrimaryKeyConstraint('pk'),
                    comment='유저 - Authentication'
                    )

def downgrade() -> None:
    op.drop_table('user_authentication')
    op.drop_table('user')