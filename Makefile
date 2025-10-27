DOCKER_HOST?=127.0.0.1

docker-build:
	docker build --tag ai-pmp .

docker-bash: docker-build
	docker run -it --rm ai-pmp bash

docker-run: docker-build
	docker rm -f ai-pmp || true
	docker run -it -p 8080:8080 \
		--name ai-pmp \
		-e PORT=8080 \
		-e SQLALCHEMY_DATABASE_URI=postgres://postgres@host.docker.internal:30501/ai-pmp \
  		ai-pmp

push:
	git push origin main

build:
	$(MAKE) -C ai-pmp build

push-production:
	git push origin main
	git push dokku@15.165.179.76:ai-pmp