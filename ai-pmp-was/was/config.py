from os import environ
from pathlib import Path

from sconfig import configure

PORT = 5001
DEBUG = False
SECRET_KEY = 'ec9e23cbe277615ab4fd38f09479d5630ac79078378bb4e74b98d72ebe3acbef'
SECRET_USER_PASSWORD_BASE_SALT = SECRET_KEY

DB_COLLNAME = 'und-x-icu'

SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_DATABASE_URI = environ.get(
    'DATABASE_URL',
    f'postgres://postgres@{environ.get("DOCKER_HOST", "localhost")}:30501/ai-pmp'
)
SQLALCHEMY_ECHO = False

R2_ACCESS_KEY_ID = ''
R2_SECRET_ACCESS_KEY = ''
R2_REGION = 'auto'
R2_BUCKET = 'ai-pmp-asset'
R2_BUCKET_ASSET_PREFIX = '/ai-pmp'
R2_ENDPOINT_URL = ''
R2_ASSET_BASE_URL = ''

TMDB_API_KEY = environ.get('TMDB_API_KEY', '')
TMDB_API_TOKEN = environ.get('TMDB_API_TOKEN', '')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

FILE_UPLOAD_MAX_SIZE = 1000 * 1024 * 1024

IS_DEBUG = False

configure(__name__)

SECRET_USER_PASSWORD_BASE_SALT = bytes.fromhex(SECRET_USER_PASSWORD_BASE_SALT)

if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
    SQLALCHEMY_DATABASE_URI = 'postgresql://' + SQLALCHEMY_DATABASE_URI.removeprefix('postgres://')

was_root_path: Path = Path(__file__).resolve().parent.parent
was_tmp_path: Path = was_root_path / "tmp"