#!/bin/bash
set -euxo pipefail

PORT=${PORT:-5000}

NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-}

(cd ai-pmp-was && venv/bin/alembic upgrade head)

(cd ai-pmp-web && npm run start -- --port 3000 &)

PROCESSES=$(expr "$(nproc)" \* 2 + 1)

cd ai-pmp-was && \
venv/bin/uwsgi \
  --master \
  --processes "$PROCESSES" \
  --http-socket "0.0.0.0:$PORT" \
  --enable-threads \
  --single-interpreter \
  --ignore-sigpipe \
  --ignore-write-errors \
  --disable-write-exception \
  --log-x-forwarded-for \
  --wsgi-file /app/ai-pmp-was/was/main.py \
  --callable app \
  --route '^(/|/[^-].*)$ http:127.0.0.1:3000' &

wait -n