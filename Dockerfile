FROM ubuntu:22.04

ENV TZ=Asia/Seoul
ENV PGTZ=$TZ
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV NODE_ENV=production

ARG NEXT_PUBLIC_ASSET_BASE_URL
ARG NEXT_PUBLIC_ASSET_DOWNLOAD_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL='' NEXT_PUBLIC_API_DELAY='0' NEXT_PUBLIC_ASSET_BASE_URL='https://asset.innopia.org' NEXT_PUBLIC_ASSET_DOWNLOAD_BASE_URL='https://asset.innopia.org'

RUN rm -f /etc/apt/apt.conf.d/docker-clean

RUN bash -c '\
set -eux; \
sed -i \
    -e "s|archive.ubuntu.com/ubuntu|mirror.kakao.com/ubuntu|" \
    -e "s|security.ubuntu.com/ubuntu|mirror.kakao.com/ubuntu|" \
    /etc/apt/sources.list; \
rm -f /etc/pip.conf || true; \
echo "" > /etc/npmrc \
'

RUN --mount=target=/var/lib/apt/lists,type=cache  \
    --mount=target=/var/cache/apt,type=cache \
    --mount=target=/root/.npm,type=cache \
    --mount=target=/root/.pub-cache,type=cache \
    --mount=target=/root/.cache,type=cache \
    --mount=target=/download,type=cache \
    <<EOF
#!/bin/bash

set -euxo pipefail

apt-get -y update

apt-get install -y ca-certificates curl gnupg
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
  gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update -y && apt-get install -y nodejs

apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update -y
apt-get install -y python3.12 python3.12-venv python3.12-dev build-essential libpcre2-dev

EOF

COPY . /app
WORKDIR /app

RUN --mount=target=/root/.npm,type=cache \
    --mount=target=/root/.cache,type=cache \
    --mount=target=/root/.pub-cache,type=cache \
    <<EOF
#!/bin/bash

set -euxo pipefail

cd /app/ai-pmp-was
python3.12 -m venv venv || { echo 'Failed to create venv'; exit 1; }
venv/bin/python --version
venv/bin/pip install pip==24.1.2 wheel==0.42.0
venv/bin/pip install -e .
venv/bin/pip install uwsgi==2.0.25.1

venv/bin/python bin/generate_api_ts_schema.py front | venv/bin/python bin/tee.py ../ai-pmp-web/src/api/schema.g.d.ts
venv/bin/python bin/generate_api_ts.py front | venv/bin/python bin/tee.py ../ai-pmp-web/src/api/api.g.ts

(cd /app/ai-pmp-web && \
  npm install --include=dev && \
  node_modules/.bin/ts-node bin/generateUrl.ts && \
  npm run build)

EOF

CMD ./serve.sh