from werkzeug.middleware.proxy_fix import ProxyFix
from flask import Flask, request, jsonify
from flask_cors import CORS

from ex.flask_ex import load_submodules, register_blueprints
from was import config, model
from was.blueprints import front
from was.model import db
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(config)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

model.db.init_app(app)
load_submodules(model)

front_url_prefix = '/-/front'
register_blueprints(app, (front, front_url_prefix))

if app.debug:
    CORS(app, supports_credentials=True, resources=[
        '*',
    ])

@app.route('/-/dokku/checks')
def dokku_checks():
    answer = db.session.query(text('1 + 1')).scalar()

    res = {
        "answer": answer,
        "headers": {key: val for key, val in request.headers.items()},
    }

    return jsonify(res)