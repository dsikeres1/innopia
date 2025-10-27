from itertools import count
from typing import TypeVar, Generic, List, Union, Tuple, Callable

from flask_sqlalchemy.session import Session
from sqlalchemy import func, or_, and_, text, Index
from sqlalchemy.orm import scoped_session

from sqlalchemy.sql import ColumnElement
from sqlalchemy.sql.elements import BooleanClauseList
from sqlalchemy.sql.selectable import Select

from ex.api import BaseModel, GenericModel
from was.model import db

null: None = None
true: bool = True
false: bool = False

def int_ceil(x: int, y: int) -> int:
    q, r = divmod(x, y)
    if r:
        q += 1
    return q

T = TypeVar('T')
U = TypeVar('U')

PAGE_ROW_ITEM = TypeVar('PAGE_ROW_ITEM', bound=BaseModel)
TableArgs = Tuple[Index | dict[str, str], ...]

class PageRow(GenericModel, Generic[PAGE_ROW_ITEM]):
    no: int
    item: PAGE_ROW_ITEM

class Pagination(GenericModel, Generic[PAGE_ROW_ITEM]):
    page: int
    pages: List[int]
    prev_page: int
    next_page: int
    has_prev: bool
    has_next: bool
    total: int
    rows: List[PageRow[PAGE_ROW_ITEM]]

def api_paginate(q: Select, page, map_: Callable[[T], PAGE_ROW_ITEM],
                 per_page: int | None = 10) -> 'Pagination[PAGE_ROW_ITEM]':
    per_page_: int = 10 if per_page is None else per_page
    p = (db.paginate(q, page=page, per_page=per_page_, error_out=False))

    pages_first = max(p.page - 2, 1)
    pages_last = min(pages_first + 4, p.pages)
    pages = list(range(pages_first, pages_last + 1))

    start = (page - 1) * per_page_
    items = tuple(map(map_, p.items))
    items_indexed = tuple(zip(count(p.total - start, step=-1), items))

    return Pagination(
        page=p.page,
        per_page=per_page_,
        pages=pages,
        prev_page=p.prev_num if p.prev_num else 1,
        next_page=p.next_num if p.next_num else p.pages,
        has_next=p.has_next,
        has_prev=p.has_prev,
        total=p.total,
        rows=[PageRow(no=index, item=item) for (index, item) in items_indexed]
    )

def icontains(column, string: str):
    return func.lower(column).contains(string.lower(), autoescape=True)

def isearch(string: str, *columns):
    keywords = list(filter(bool, map(lambda x: x.strip(), string.split(' '))))

    conditions = []

    for column in columns:
        and_conditions = [icontains(column, keyword) for keyword in keywords]
        conditions.append(and_(True, *and_conditions))

    return or_(*conditions)

def pg_xlock2(session: Session | scoped_session[Session], group_id: int, lock_id: int) -> None:
    session.execute(
        text('select pg_advisory_xact_lock(:group_id, :lock_id)'),
        {'group_id': group_id, 'lock_id': lock_id}
    )

def pg_try_xlock2(session: Session | scoped_session[Session], group_id: int, lock_id: int) -> bool:
    return session.scalar(
        text('select pg_try_advisory_xact_lock(:group_id, :lock_id)'),
        {'group_id': group_id, 'lock_id': lock_id}
    )

Condition = Union[ColumnElement[bool], BooleanClauseList]
Conditions = List[Condition]