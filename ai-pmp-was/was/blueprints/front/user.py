from ex.api import BaseModel, Res, ok
from was.blueprints.front import app
from was.model import db
from was.model.user import User

class UserInfo(BaseModel):
    pk: int

class UserListReq(BaseModel):
    pass

class UserListRes(BaseModel):
    users: list[UserInfo]

    @classmethod
    def from_model(cls, user: User) -> 'UserInfo':
        return UserInfo(
            pk=user.pk,
        )

@app.api(public=True)
def user_list(req: UserListReq) -> Res[UserListRes]:
    q = db.select(User)
    users = db.session.execute(q).scalars()
    return ok(UserListRes(users=list(map(lambda x: UserListRes.from_model(x), users))))