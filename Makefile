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

.PHONY: all build up stop down clean fclean re help web-install \
	web-database web-auth web-i18n web-gateway web-all web-services \
	run watch ps status destroy-all sass tsc start dev test-db db-backup

help:
	@echo ""
	@echo "════════════════════════════════════════════════════════════"
	@echo "                  FILMOTECA MAKEFILE"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "── Docker / Containers ────────────────────────────────────"
	@echo "  make all           - Build base + levantar toda la stack"
	@echo "  make build         - Construir imágenes"
	@echo "  make up            - Levantar contenedores"
	@echo "  make app           - Levantar solo el contenedor app"
	@echo "  make stop          - Parar contenedores"
	@echo "  make down          - Eliminar contenedores y red"
	@echo "  make clean         - Limpiar contenedores, imágenes y volúmenes"
	@echo "  make fclean        - Limpieza total de docker"
	@echo "  make re            - Rebuild completo"
	@echo ""
	@echo "── Estado / Debug ─────────────────────────────────────────"
	@echo "  make ps            - Ver estado compose"
	@echo "  make status        - Ver containers/images/volumes/networks"
	@echo "  make destroy-all   - Eliminar TODO del sistema docker"
	@echo ""
	@echo "── Microservicios Web ─────────────────────────────────────"
	@echo "  make web-install   - Instalar dependencias"
	@echo "  make web-database  - Iniciar servicio database"
	@echo "  make web-auth      - Iniciar servicio auth"
	@echo "  make web-i18n      - Iniciar servicio i18n"
	@echo "  make web-gateway   - Iniciar API gateway"
	@echo "  make web-all       - Abrir todos los servicios en gnome-terminal"
	@echo "  make web-services  - Ejecutar todos los servicios"
	@echo ""
	@echo "── Desarrollo ─────────────────────────────────────────────"
	@echo "  make run           - Abrir microservicios en Kitty"
	@echo "  make watch         - Sass + TypeScript watch"
	@echo "  make sass          - Sass watch"
	@echo "  make tsc           - TypeScript watch"
	@echo "  make start         - Backend producción"
	@echo "  make dev           - Backend desarrollo"
	@echo "  make test-db       - Tests base de datos"
	@echo "  make db-backup     - Backup base de datos"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

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

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down --remove-orphans

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


# ── Microservicios web ────────────────────────────────────────────────────────

# Instala dependencias en todos los servicios
web-install:
	@echo "Instalando dependencias de todos los microservicios..."
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

web-all:
	gnome-terminal --tab -- bash -c "npm --prefix web/database run dev"
	gnome-terminal --tab -- bash -c "npm --prefix web/auth run dev"
	gnome-terminal --tab -- bash -c "npm --prefix web/i18n run dev"
	gnome-terminal --tab -- bash -c "npm --prefix web/gateway run dev"

# Arranca los 4 microservicios en paralelo (database y auth primero, gateway al final)
web-services:
	@echo "Iniciando microservicios web..."
	@echo "  [1] web/database  [2] web/auth  [3] web/i18n  [4] web/gateway"
	$(MAKE) web-database &
	$(MAKE) web-auth &
	$(MAKE) web-i18n &
	@echo "Esperando a que los servicios base estén listos antes del gateway..."
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
	@echo "Para producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
	sass --watch --update ./web/frontend/src/scss/index.scss:./web/frontend/public/css/styles.css

# TypeScript watch
tsc:
	npm --prefix web run tsc
