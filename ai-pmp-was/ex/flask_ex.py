import importlib
import logging
import pkgutil
import sys
from types import ModuleType
from typing import Optional, Tuple, Union, Type, TypeVar, cast

from flask import Flask, g, abort, request

from werkzeug.local import LocalProxy

def initialize(app: Flask) -> None:

    app.logger.setLevel(logging.DEBUG if app.debug else logging.INFO)

    if app.debug:
        _initialize_debug(app)

def _initialize_debug(app: Flask):

    if not app.config.get('SEND_FILE_MAX_AGE_DEFAULT'):
        app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

    if app.config['ENV'] == 'production':
        app.config['ENV'] = 'development'

def register_blueprints(app: Flask, *blueprints: Union[ModuleType, Tuple[ModuleType, str]]) -> None:
    url_prefix: Optional[str]

    for bp in blueprints:
        if isinstance(bp, tuple):
            module, url_prefix = bp
        else:
            module, url_prefix = bp, None

        load_submodules(module)

        app.register_blueprint(
            blueprint=module.app,
            url_prefix=url_prefix
        )

def load_submodules(module) -> None:

    for finder, name, is_pkg in pkgutil.iter_modules(module.__path__):
        module_name = f"{module.__name__}.{name}"
        if module_name not in sys.modules:
            child_module = importlib.import_module(module_name)
        else:
            child_module = sys.modules[module_name]

        if is_pkg:
            load_submodules(child_module)

T = TypeVar('T')

def global_proxy(name: str, builder: Type[T]) -> T:
    def f():
        if not hasattr(g, name):
            setattr(g, name, builder())
        return getattr(g, name)

    return LocalProxy(f)

def not_found():
    abort(404)

def remote_addr():
    if 'CF-Connecting-IP' in request.headers and 'X-Forwarded-For' in request.headers:
        ipv6 = request.headers['CF-Connecting-IP']
        return request.headers['X-Forwarded-For'].split(',')[0].strip()
    elif 'X-Forwarded-For' in request.headers:
        return request.headers['X-Forwarded-For'].split(',')[-1].strip()
    elif 'X-Real-IP' in request.headers:

        return request.headers['X-Real-IP']
    else:
        return request.remote_addr

is_get = cast(bool, LocalProxy(lambda: request.method == 'GET'))
is_post = cast(bool, LocalProxy(lambda: request.method == 'POST'))