from typing import Optional
from uuid import UUID

from sqlalchemy import func

from ex.api import BaseModel, Res, ok, err
from was.blueprints.front import app, bg
from was.model import db
from was.model.user import UserAuthentication

class AccessTokenReq(BaseModel):
    pass

class AccessTokenRes(BaseModel):
    pk: Optional[int]
    access_token: Optional[UUID]

@app.api()
def access_token_get(_: AccessTokenReq) -> Res[AccessTokenRes]:

    if bg.user_authentication:
        return ok(AccessTokenRes(
            pk=bg.user.pk,
            access_token=bg.user_authentication.access_token
        ))

    token: Optional[UserAuthentication] = None
    pk = bg.get_user_authentication_pk()

    if pk:
        token = (db.session.execute(db.select(UserAuthentication)
                                    .filter(UserAuthentication.pk == pk,
                                            func.now() < UserAuthentication.expire_at)
                                    )
                 .scalar_one_or_none())
        if not token:
            bg.set_user_authentication_pk(None)
            return err("사용자 정보가 만료되었습니다.")

    if not token:
        return ok(AccessTokenRes(pk=None, access_token=None))

    return ok(AccessTokenRes(
        pk=bg.user.pk,
        access_token=token.access_token
    ))