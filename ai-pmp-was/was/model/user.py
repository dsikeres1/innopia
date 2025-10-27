from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import String, DateTime, func, ForeignKey, Boolean
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ex.py.datetime_ex import now
from was.model import Model

class User(Model):
    __tablename__ = 'user'

    pk: Mapped[int] = mapped_column(primary_key=True, comment='CSV userId (1-100)')

    gender: Mapped[str] = mapped_column(String(20), comment='Female/Male')
    age: Mapped[str] = mapped_column(String(20), comment='1-17, 18-24, 25-34, 35-44, 45-49, 50-55, 56+')
    occupation: Mapped[str] = mapped_column(String(100), comment='K-12 student, Programmer, etc.')
    zip: Mapped[str] = mapped_column(String(20), comment='우편번호')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        {'comment': '유저'},
    )

class UserAuthentication(Model):
    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    update_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    sign_out: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment='로그아웃 여부')

    user_pk: Mapped[int] = mapped_column(ForeignKey(User.pk))
    user: Mapped[User] = relationship()
    access_token: Mapped[UUID] = mapped_column(postgresql.UUID())
    expire_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    def update_expire_at(self) -> None:

        self.expire_at = now() + timedelta(days=7)

    @hybrid_property
    def expired(self) -> bool:
        return now() > self.expire_at

    __table_args__ = (
        {'comment': '유저 - Authentication'},
    )