from typing import TYPE_CHECKING

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

db: SQLAlchemy = SQLAlchemy(

    session_options={"autoflush": False}
)

Base = DeclarativeBase
Base = db.Model

class Model(Base):

    __abstract__ = True

LOCK_ASSET = 1