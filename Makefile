# Makefile para proyecto Node.js + TypeScript + Sass
# gnome-terminal -- bash -c "npm run start; exec bash"

INFRA ?= docker
SHELL := /bin/bash
KITTY := /usr/bin/kitty

WEB_BASE := filmoteca-web-base
SERVICES := filmoteca-app filmoteca-database filmoteca-auth filmoteca-i18n filmoteca-gateway filmoteca-nginx
NETWORKS := filmoteca-net
VOLUMES :=
COMPOSE_FILE := infra/containers/docker-compose.yml
COMPOSE := $(INFRA) compose -f $(COMPOSE_FILE)

.PHONY: all build up stop down clean fclean re tails help web-install \
	web-database web-auth web-i18n web-gateway web-all web-services \
	run watch ps status destroy-all sass tsc start dev

help:
	@echo -ne "\n"
	@echo -ne "\n════════════════════════════════════════════════════════════"
	@echo -ne "\n                  FILMOTECA MAKEFILE"
	@echo -ne "\n════════════════════════════════════════════════════════════"
	@echo -ne "\n"
	@echo -ne "\n── Docker / Containers ────────────────────────────────────"
	@echo -ne "\n  make all           - Build base + levantar toda la stack"
	@echo -ne "\n  make build         - Construir imágenes"
	@echo -ne "\n  make up            - Levantar contenedores"
	@echo -ne "\n  make app           - Levantar solo el contenedor app"
	@echo -ne "\n  make stop          - Parar contenedores"
	@echo -ne "\n  make down          - Eliminar contenedores y red"
	@echo -ne "\n  make clean         - Limpiar contenedores, imágenes y volúmenes"
	@echo -ne "\n  make fclean        - Limpieza total de docker"
	@echo -ne "\n  make re            - Rebuild completo"
	@echo -ne "\n"
	@echo -ne "\n── Estado / Debug ─────────────────────────────────────────"
	@echo -ne "\n  make ps            - Ver estado compose"
	@echo -ne "\n  make status        - Ver containers/images/volumes/networks"
	@echo -ne "\n  make destroy-all   - Eliminar TODO del sistema docker"
	@echo -ne "\n"
	@echo -ne "\n── Microservicios Web ─────────────────────────────────────"
	@echo -ne "\n  make web-install   - Instalar dependencias"
	@echo -ne "\n  make web-database  - Iniciar servicio database"
	@echo -ne "\n  make web-auth      - Iniciar servicio auth"
	@echo -ne "\n  make web-i18n      - Iniciar servicio i18n"
	@echo -ne "\n  make web-gateway   - Iniciar API gateway"
	@echo -ne "\n  make web-all       - Abrir todos los servicios en gnome-terminal"
	@echo -ne "\n  make web-services  - Ejecutar todos los servicios"
	@echo -ne "\n"
	@echo -ne "\n── Desarrollo ─────────────────────────────────────────────"
	@echo -ne "\n  make run           - Abrir microservicios en Kitty"
	@echo -ne "\n  make watch         - Sass + TypeScript watch"
	@echo -ne "\n  make sass          - Sass watch"
	@echo -ne "\n  make tsc           - TypeScript watch"
	@echo -ne "\n  make start         - Backend producción"
	@echo -ne "\n  make dev           - Backend desarrollo"
	@echo -ne "\n"
	@echo -ne "\n════════════════════════════════════════════════════════════"

# ── Docker developer ────────────────────────────────────────────────────────

all: docker-build-base
	$(COMPOSE) up --build -d

docker-build-base:
	$(INFRA) build --network=host -f infra/containers/web/base/Dockerfile -t $(WEB_BASE) .

build: docker-build-base
	$(COMPOSE) build

app:
	$(COMPOSE) up -d app

up:
	$(COMPOSE) up -d
	@echo -ne "\nhttps://localhost:8080/"
	@echo -ne "\nhttps://localhost:3000/"

down:
	$(COMPOSE) down --remove-orphans

stop:
	$(COMPOSE) stop

clean:
	$(COMPOSE) down -v --remove-orphans --rmi all
	$(COMPOSE) image rm $(WEB_BASE) || true

fclean: clean
	@$(INFRA) stop $(SERVICES) 2>/dev/null || true
	@$(INFRA) rm $(SERVICES) 2>/dev/null || true
	@$(INFRA) rmi -f $(SERVICES) 2>/dev/null || true
	@$(INFRA) rmi -f $(WEB_BASE) 2>/dev/null || true
	@$(INFRA) volume rm $(VOLUMES) 2>/dev/null || true
	@$(INFRA) network rm $(NETWORKS) 2>/dev/null || true
	@$(COMPOSE) down -v --rmi all 2>/dev/null || true

re: fclean all

tails:
	@echo -ne "\n --- FILMOTECA-GATEWAY ---\n"
	docker logs filmoteca-gateway | tail -n 20
	@echo -ne "\n --- FILMOTECA-AUTH ---\n"
	docker logs filmoteca-auth | tail -n 20
	@echo -ne "\n --- FILMOTECA-I18N ---\n"
	docker logs filmoteca-i18n | tail -n 20
	@echo -ne "\n --- FILMOTECA-DATABASE ---\n"
	docker logs filmoteca-database | tail -n 20
	@echo -ne "\n --- FILMOTECA-APP ---\n"
	docker logs filmoteca-app | tail -n 20
	@echo -ne "\n --- FILMOTECA-NGINX ---\n"
	docker logs filmoteca-nginx | tail -n 20
	@echo -ne "\n --- FILMOTECA-WEB-BASE ---\n"
	docker logs filmoteca-web-base | tail -n 20

# ── Microservicios web ────────────────────────────────────────────────────────

# Instala dependencias en todos los servicios
web-install:
	@echo -ne "\nInstalando dependencias de todos los microservicios..."
	npm --prefix web install
	npm --prefix web/database install
	npm --prefix web/auth install
	npm --prefix web/i18n install
	npm --prefix web/gateway install

# Servicios individuales
web-database:
	npm --prefix web/database run dev

web-auth:
	npm --prefix web/auth run dev

web-i18n:
	npm --prefix web/i18n run dev

web-gateway:
	npm --prefix web/gateway run dev

# Node.js scripts
start:
	npm --prefix web run start

dev:
	npm --prefix web run dev

run-kitty:
	./infra/tools/run_kitty.sh

# Arranca los 4 microservicios en paralelo (database y auth primero, gateway al final)
web-services:
	@echo -ne "\nIniciando microservicios web..."
	@echo -ne "\n  [1] web/database  [2] web/auth  [3] web/i18n  [4] web/gateway"
	$(MAKE) web-database &
	$(MAKE) web-auth &
	$(MAKE) web-i18n &
	@echo -ne "\nEsperando a que los servicios base estén listos antes del gateway..."
	sleep 5
	$(MAKE) web-gateway &
	wait


# ── Tools Develop ────────────────────────────────────────────────────────

run:
	@$(KITTY) @ launch --type=tab --tab-title MAKE --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make web-gateway; exec bash"
	@$(KITTY) @ launch --location=vsplit --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make web-database; exec bash"
	@$(KITTY) @ launch --location=vsplit --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make web-auth; exec bash"
	@$(KITTY) @ launch --location=hsplit --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make web-i18n; exec bash"

watch:
	@$(KITTY) @ launch --type=tab --tab-title MAKE2 --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make sass; exec bash"
	@$(KITTY) @ launch --location=hsplit --cwd /home/user/Documents/Projects/media/filmoteca bash -c "make tsc; exec bash"

ps:
	@$(COMPOSE) ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

status:
	@$(INFRA) ps -a
	@$(INFRA) images -a
	@$(INFRA) volume ls
	@$(INFRA) network ls

destroy-all:
	@$(INFRA) stop $(INFRA ps -aq) || true
	@$(INFRA) rm $(INFRA ps -aq) || true
	@$(INFRA) rmi -f $(INFRA images -aq) || true
	@$(INFRA) volume prune -f
	@$(INFRA) volume rm $(INFRA volume ls -q) || true
	@$(INFRA) network prune -f
	@$(INFRA) system prune -a -f --volumes
	@$(INFRA) compose down -v --rmi local

# Sass watch
sass:
	@echo -ne "\nPara producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
	sass --watch --update ./web/frontend/src/scss/index.scss:./web/frontend/public/css/styles.css

# TypeScript watch
tsc:
	npm --prefix web run tsc
