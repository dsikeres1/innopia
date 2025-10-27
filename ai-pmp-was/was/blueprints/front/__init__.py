from typing import Tuple, Optional
from uuid import UUID, uuid4

from flask import request, Response, session, has_request_context
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ex.api import ApiBlueprint, res_jsonify, Res, ResStatus, BaseModel, err, ok
from ex.flask_ex import global_proxy
from ex.sqlalchemy_ex import false
from was.model import db
from was.model.user import UserAuthentication, User

class FrontBlueprint(ApiBlueprint[None]):
    def validate_login(self) -> bool:
        return bg.user_or_none is not None

    def validate_permission(self, permissions: Tuple[None, ...]) -> bool:

        return True

app = FrontBlueprint('front_app', __name__)

class UserGlobal:
    _USER_AUTHENTICATION_PK = "USER_AUTHENTICATION_PK"
    _user_authentication: Optional[UserAuthentication]

    def get_user_authentication_pk(self) -> Optional[int]:
        return session.get(self._USER_AUTHENTICATION_PK)

    def set_user_authentication_pk(self, access_token_pk):
        session[self._USER_AUTHENTICATION_PK] = access_token_pk

    @property
    def user_authentication(self) -> Optional[UserAuthentication]:
        if hasattr(self, "_user_authentication"):
            return self._user_authentication
        self._user_authentication = None

        access_token = request.headers.get("X-User-Access-Token")
        if access_token:
            user_authentication = (db.session.execute(db.select(UserAuthentication)
                                                      .options(joinedload(UserAuthentication.user))
                                                      .filter(UserAuthentication.access_token == access_token,
                                                              ~UserAuthentication.expired,
                                                              UserAuthentication.sign_out == false)
                                                      )
                                   .scalar_one_or_none())

            if user_authentication:
                self._user_authentication = user_authentication
                return user_authentication
            else:
                self.set_user_authentication_pk(None)
        return None

    @property
    def user_or_none(self) -> Optional[User]:
        if not has_request_context():
            return None
        return self.user_authentication.user if self.user_authentication else None

    @property
    def user(self) -> User:
        assert self.user_or_none, "현재 요청에는 user 가 포함 되어 있지 않다."
        return self.user_or_none

bg = global_proxy("user", UserGlobal)

@app.before_request
def before_request() -> Response | None:
    raw_access_token = request.headers.get('X-User-Access-Token')
    auth: UserAuthentication | None = None
    access_token: UUID | None = None
    if raw_access_token:
        try:
            access_token = UUID(raw_access_token)
        except ValueError:
            pass
    if access_token:
        conditions = [
            UserAuthentication.access_token == access_token,
            UserAuthentication.expire_at >= func.now()
        ]
        auth = (db.session.execute(db.select(UserAuthentication)
                                   .filter(*conditions)
                                   )
                .scalar_one_or_none())
        if auth:
            auth.update_expire_at()
            db.session.commit()

    if not auth:
        require_access_token = True
        match ((request.endpoint or '').split('.', maxsplit=2)):
            case [_, endpoint]:
                if endpoint in ['sign_in', 'user_list']:

                    require_access_token = False
            case _:

                pass
        if require_access_token:
            return res_jsonify(Res(errors=[], status=ResStatus.INVALID_ACCESS_TOKEN, validation_errors=[]))

    return None

class SignInReq(BaseModel):
    pk: str

class SignInRes(BaseModel):
    access_token: UUID

@app.api(public=True)
def sign_in(req: SignInReq) -> Res[SignInRes]:
    user: User | None = (db.session.execute(db.select(User).filter(User.pk == req.pk)).scalar_one_or_none())

    if not user:
        return err('잘못된 유저입니다.')

    auth = UserAuthentication()
    auth.access_token = uuid4()
    auth.user = user
    auth.update_expire_at()
    db.session.add(auth)
    db.session.commit()
    bg.set_user_authentication_pk(auth.pk)
    return ok(SignInRes(access_token=auth.access_token))

class SignOutReq(BaseModel):
    pass

class SignOutRes(BaseModel):
    pass

@app.api()
def sign_out(req: SignOutReq) -> Res[SignOutRes]:
    _sign_out()
    return ok(SignOutRes())

def _sign_out():
    pk = bg.get_user_authentication_pk()

    if not pk:
        return

    bg.set_user_authentication_pk(None)
    token = UserAuthentication.query \
        .filter(UserAuthentication.pk == pk, ~UserAuthentication.expired) \
        .one_or_none()

    if not token:
        return

    token.expire_at = func.now()
    db.session.commit()