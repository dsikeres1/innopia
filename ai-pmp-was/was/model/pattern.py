from datetime import datetime, date
import random

from sqlalchemy import String, DateTime, Date, ForeignKey, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from was.model import Model
from was.model.user import User
from was.model.asset import Asset

class PatternProgram(Model):
    __tablename__ = 'pattern_program'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    name_ko: Mapped[str] = mapped_column(String(200), unique=True, comment='한글 프로그램명')
    name_en: Mapped[str] = mapped_column(String(200), unique=True, comment='영문 프로그램명')
    genre_ko: Mapped[str] = mapped_column(String(50), comment='한글 장르')
    genre_en: Mapped[str] = mapped_column(String(50), comment='영문 장르')

    asset_pk: Mapped[int | None] = mapped_column(ForeignKey(Asset.pk), nullable=True, comment='썸네일 (없으면 같은 장르에서 랜덤 선택)')
    asset: Mapped[Asset | None] = relationship()

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        {'comment': 'Pattern - 프로그램 마스터'},
    )

    @property
    def thumbnail_url(self) -> str | None:

        if self.asset:
            return self.asset.url

        from was.model import db

        q = select(PatternProgram) \
            .filter(PatternProgram.genre_ko == self.genre_ko,
                    PatternProgram.asset_pk.isnot(None),
                    PatternProgram.pk != self.pk) \
            .join(PatternProgram.asset)

        programs_with_asset = list(db.session.execute(q).scalars())

        if programs_with_asset:
            selected = random.choice(programs_with_asset)
            return selected.asset.url if selected.asset else None

        return None

class PatternTVSchedule(Model):
    __tablename__ = 'pattern_tv_schedule'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    day_of_week: Mapped[str] = mapped_column(String(20), comment='월요일, 화요일, ...')
    time: Mapped[str] = mapped_column(String(10), comment='HH:MM')
    channel: Mapped[str] = mapped_column(String(20), comment='채널1, 채널2, ...')

    program_pk: Mapped[int] = mapped_column(ForeignKey(PatternProgram.pk))
    program: Mapped[PatternProgram] = relationship()

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        {'comment': 'Pattern - TV 채널 편성표'},
    )

class PatternTVViewingLog(Model):
    __tablename__ = 'pattern_tv_viewing_log'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_pk: Mapped[int] = mapped_column(ForeignKey(User.pk))
    user: Mapped[User] = relationship()

    program_pk: Mapped[int] = mapped_column(ForeignKey(PatternProgram.pk))
    program: Mapped[PatternProgram] = relationship()

    quarter: Mapped[str] = mapped_column(String(10), comment='Q1, Q2, Q3, Q4')
    view_date: Mapped[date] = mapped_column(Date, comment='시청 날짜')
    view_time: Mapped[str] = mapped_column(String(10), comment='시청 시간 HH:MM')
    day: Mapped[str] = mapped_column(String(20), comment='요일')
    channel: Mapped[str] = mapped_column(String(20), comment='채널')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        {'comment': 'Pattern - TV 시청 기록'},
    )