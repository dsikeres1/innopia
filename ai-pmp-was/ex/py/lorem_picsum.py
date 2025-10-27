import os.path
from itertools import count, cycle
from json import loads, dumps
from random import Random
from typing import List, Dict, Any, Iterator, Tuple
from unittest.mock import MagicMock

import requests
from pydantic import BaseModel

class LoremPicsumJar(Iterator[Tuple[int, 'LoremPicsum']]):
    _picsums_it: Iterator[Tuple[int, 'LoremPicsum']]

    def __init__(self) -> None:
        super().__init__()
        with open(os.path.join(os.path.dirname(__file__), 'lorem_picsum.json')) as f:
            picsums = [LoremPicsum.parse_obj(x) for x in loads(f.read())]

        Random(0).shuffle(picsums)

        self._picsums_it = enumerate(cycle(picsums))

    def next(self) -> Tuple[int, 'LoremPicsum']:
        return next(self)

    def __next__(self) -> Tuple[int, 'LoremPicsum']:
        return next(self._picsums_it)

class LoremPicsum(BaseModel):
    id: str
    author: str
    width: int
    height: int
    url: str
    download_url: str

def _fetch_list(page=1, limit=100) -> List['LoremPicsum']:
    json = _get_json('https://picsum.photos/v2/list', {'page': page, 'limit': limit})
    return [LoremPicsum.parse_obj(i) for i in json]

def _get_json(url: str, params: Dict[str, Any]):
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.json()

def _dump_list() -> None:
    picsums: List[LoremPicsum] = []

    for page in count(1):
        rs = _fetch_list(page)
        if not rs:
            break
        picsums.extend(rs)

    picsums.sort(key=lambda picsum: int(picsum.id))

    with open(os.path.join(os.path.dirname(__file__), 'lorem_picsum.json'), 'w') as f:
        f.write(dumps([x.dict() for x in picsums]))

def test_lorem_picsum_next():
    picsum_jar = LoremPicsumJar()
    index, lp = picsum_jar.next()
    assert lp == LoremPicsum(
        id='0', author='Alejandro Escamilla', width=5616, height=3744,
        url='https://unsplash.com/photos/yC-Yzbqy7PY',
        download_url='https://picsum.photos/id/0/5616/3744'
    )

def test_list_api(mocker):

    test_data = loads('''[{
        "id":"0", "author":"Alejandro Escamilla","width":5616,"height":3744,
        "url":"https://unsplash.com/photos/yC-Yzbqy7PY",
        "download_url":"https://picsum.photos/id/0/5616/3744"
    }]''')
    with mocker.patch(__name__ + '._get_json', MagicMock(return_value=test_data)):
        assert _fetch_list(1, 1) == [LoremPicsum(
            id='0', author='Alejandro Escamilla', width=5616, height=3744,
            url='https://unsplash.com/photos/yC-Yzbqy7PY',
            download_url='https://picsum.photos/id/0/5616/3744'
        )]

if __name__ == '__main__':
    _dump_list()