import os
import sys

from flask import url_for
from more_itertools import flatten
from stringcase import camelcase

from ex.api import ApiBlueprint
from ex.py.datetime_ex import now
from was import application
from was.application import app

def main(_app: ApiBlueprint) -> None:
    print('/* tslint:disable */')
    print('/* eslint-disable */')
    print(f'// 자동생성 파일 수정 금지 - {os.path.basename(__file__)} {now()}')
    print('')

    schemas = _app.export_api_schema()

    schema_names = sorted(set(flatten([i.req.__name__, i.res_data.__name__] for i in schemas)))
    print(f"import {'{' + ','.join(schema_names) + '}'} from './schema.g';")

    print("import {ApiBase} from './apiBase';")
    print('')

    print(f'export class Api extends ApiBase {{')
    for schema in schemas:
        url = url_for(_app.name + '.' + schema.endpoint)
        print(
            f"\treadonly {camelcase(schema.endpoint)} = "
            f"this.c<{schema.req.__name__}, {schema.res_data.__name__}>('{url}');"
        )
    print('}')

if __name__ == '__main__':

    is_front = sys.argv[1:][0]
    with app.test_request_context():
        match is_front:
            case 'front':
                main(application.front.app)
            case default:
                main(application.front.app)