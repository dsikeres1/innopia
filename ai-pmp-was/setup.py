from setuptools import setup, find_packages

setup(
    name="ai-pmp",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'setuptools==80.4.0',

        'Flask==3.1.1',
        'sconfig==0.0.3',
        'pydantic==1.10.22',
        'stringcase==1.2.0',
        'Flask-Cors==4.0.0',

        'SQLAlchemy==2.0.40',
        'Flask-SQLAlchemy==3.1.1',
        'alembic==1.15.2',
        'psycopg2-binary==2.9.10',
        'coint-paginatify-sqlalchemy==0.0.4',

        'pytz==2025.2',
        'types-pytz==2025.2.0.20250326',
        'more-itertools==10.7.0',

        'mypy==1.15.0',
        'watchdog==6.0.0',
        'boto3==1.38.15',
        'requests==2.32.3',
        'types-requests==2.32.0.20250328',
        'python-dotenv==1.1.0',

        'pandas==2.2.3',
        'scikit-learn==1.6.1',
        'openpyxl==3.1.5',
    ],
)