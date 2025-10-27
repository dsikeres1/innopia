from io import SEEK_END, SEEK_SET
from typing import Union, IO

from werkzeug.datastructures import FileStorage

def get_file_size(file: Union[IO[bytes], FileStorage]) -> int:
    file.seek(0, SEEK_END)
    file_size = file.tell()
    file.seek(SEEK_SET)
    return file_size