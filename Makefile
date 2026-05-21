# Makefile para proyecto Node.js + TypeScript + Sass
# gnome-terminal -- bash -c "npm run start; exec bash"

SHELL := /bin/bash

COMPOSE_FILE := infra/containers/docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)
WEB_BASE_IMAGE := filmoteca-web-base:latest

# Carpeta de TypeScript (ajusta si es diferente)
TS_SRC := src
TS_BUILD := dist

.PHONY: help sass start dev test-db db-backup ts-watch all \
	web-database web-auth web-i18n web-gateway web-install web-services \
	docker-build-base docker-build docker-up docker-stop docker-down docker-clean

help:
	@echo "Makefile commands disponibles:"
	@echo "  make sass         - Ejecuta Sass en modo watch (con mensaje para producción)"
	@echo "  make start        - Inicia Node.js en producción (npm start)"
	@echo "  make dev          - Inicia Node.js en modo desarrollo con nodemon"
	@echo "  make test-db      - Ejecuta pruebas de base de datos"
	@echo "  make db-backup    - Respaldar queries de la base de datos"
	@echo "  make tsc          - Inicia TypeScript en modo watch"
	@echo "  make all          - Ejecuta sass, ts-watch y dev (modo desarrollo completo)"
	@echo ""
	@echo "  Microservicios web:"
	@echo "  make web-install  - Instala dependencias de todos los microservicios"
	@echo "  make web-database - Inicia el servicio de base de datos (web/database)"
	@echo "  make web-auth     - Inicia el servicio de autenticación (web/auth)"
	@echo "  make web-i18n     - Inicia el servicio de i18n (web/i18n)"
	@echo "  make web-gateway  - Inicia el API Gateway (web/gateway)"
	@echo "  make web-services - Inicia todos los microservicios en paralelo"
	@echo ""
	@echo "  Docker production:"
	@echo "  make docker-build-base - Construye la imagen base compartida"
	@echo "  make docker-build      - Construye todas las imágenes de producción"
	@echo "  make docker-up         - Levanta toda la pila de producción"
	@echo "  make docker-stop       - Detiene toda la pila de producción"
	@echo "  make docker-down       - Detiene y elimina contenedores y red"
	@echo "  make docker-clean      - Elimina contenedores, volúmenes e imágenes"

# Sass watch
sass:
	@echo "Para producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
	sass --watch --update ./web/frontend/src/scss/index.scss:./web/frontend/public/css/styles.css

# Node.js scripts
start:
	npm --prefix web/backend run start

dev:
	npm --prefix web/backend run dev

test-db:
	npm --prefix web/database run test:db

db-backup:
	npm --prefix web/backend run db:backup

# TypeScript watch
tsc:
	npm --prefix web run tsc

# Modo desarrollo completo: Sass + TypeScript + Nodemon
all:
	@echo "Iniciando modo desarrollo completo..."
	@echo "Sass, TypeScript watch y Nodemon se ejecutarán en paralelo..."
	# Usamos & para ejecutar en background y wait para no salir del makefile
	$(MAKE) sass &
	$(MAKE) tsc &
	$(MAKE) dev &
	wait

# ── Microservicios web ────────────────────────────────────────────────────────

# Instala dependencias en todos los servicios
web-install:
	@echo "Instalando dependencias de todos los microservicios..."
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

# ── Docker production ────────────────────────────────────────────────────────

docker-build-base:
	docker build -f infra/containers/web/base/Dockerfile -t $(WEB_BASE_IMAGE) .

docker-build: docker-build-base
	$(COMPOSE) build

docker-up: docker-build-base
	$(COMPOSE) up -d

docker-stop:
	$(COMPOSE) stop

docker-down:
	$(COMPOSE) down --remove-orphans

docker-clean:
	$(COMPOSE) down -v --remove-orphans --rmi all
	-docker image rm $(WEB_BASE_IMAGE)
