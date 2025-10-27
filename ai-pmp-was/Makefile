open: setup
	pycharm .

setup: venv
	venv/bin/pip install pip==25.2
	venv/bin/pip install -e .

venv:
	python3.13 -m venv venv

watch: setup
	venv/bin/dmypy restart

	-$(MAKE) watch-run
	venv/bin/watchmedo shell-command --patterns="*.py;*.ini;*.tsx" --recursive --ignore-directories --drop --command='echo ""; make watch-run' .

watch-run: code-gen mypy-check

mypy-check:

	venv/bin/dmypy run -- was ex bin

code-gen:
	venv/bin/python bin/generate_api_ts_schema.py front | venv/bin/python bin/tee.py ../ai-pmp-web/src/api/schema.g.d.ts
	venv/bin/python bin/generate_api_ts.py front | venv/bin/python bin/tee.py ../ai-pmp-web/src/api/api.g.ts

db-generate-sql:
	venv/bin/python bin/generate_insert_sql.py

db-import:
	bin/db_import.sh

pattern-train-model:
	venv/bin/python bin/train_pattern_model.py

dev:
	docker compose up -d
	sleep 1

dev-clean:
	docker compose down -v --rmi local

dev-reset: dev-clean dev
	venv/bin/alembic upgrade head

dev-reinitialize: dev-reset db-generate-sql db-import pattern-train-model

ex/py/lorem_picsum.json: ex/py/lorem_picsum.py
	venv/bin/python ex/py/lorem_picsum.py