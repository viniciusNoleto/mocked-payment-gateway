include .env

MAKEFLAGS += --no-print-directory

DOCKERFILE := docker-compose.${APP_ENV}.yml
APP_NAME := mocked-payment-gateway-app

build:
	@docker compose -f $(DOCKERFILE) build --no-cache

build-cache:
	@docker compose -f $(DOCKERFILE) build

install-deps:
	@docker compose -f $(DOCKERFILE) run --rm $(APP_NAME) npm install

db-generate:
	@docker compose -f $(DOCKERFILE) exec $(APP_NAME) npm run db:generate

db-migrate:
	@docker compose -f $(DOCKERFILE) exec $(APP_NAME) npm run db:migrate

db-seed:
	@docker compose -f $(DOCKERFILE) exec $(APP_NAME) npm run db:seed

logs:
	@docker logs -f $(APP_NAME)

watch:
	@docker compose -f $(DOCKERFILE) up

up:
	@docker compose -f $(DOCKERFILE) up -d

down:
	@docker compose -f $(DOCKERFILE) down

restart:
	@make down
	@make up

c :=
exec:
	@docker compose -f $(DOCKERFILE) exec $(APP_NAME) $(c)

in-app:
	@docker compose -f $(DOCKERFILE) exec -it $(APP_NAME) /bin/sh

test:
	@make exec c="npm test"

s :=
t :=
m :=
step:
	@echo
	@echo "█▓▒░ \033[38;2;255;196;12m[$(s)/$(t)]\033[0m $(m)"
	@echo

install:
	@make step s=1 t=5 m="Building the Docker image..."
	@make build
	@make step s=2 t=5 m="Installing dependencies (npm install)..."
	@make install-deps
	@make step s=3 t=5 m="Starting the containers..."
	@make up
	@make step s=4 t=5 m="Running database migrations..."
	@make db-migrate
	@make step s=5 t=5 m="Running database seeds..."
	@make db-seed
	@echo
	@echo "░▒▓█ \033[38;2;22;198;12mMocked Payment Gateway\033[0m running at http://localhost:$(APP_PORT)"
	@echo
