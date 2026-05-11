# Makefile para proyecto Node.js + TypeScript + Sass
# gnome-terminal -- bash -c "npm run start; exec bash"

SHELL := /bin/bash

# Carpeta de TypeScript (ajusta si es diferente)
TS_SRC := src
TS_BUILD := dist

.PHONY: help sass start dev test-db db-backup ts-watch all

help:
	@echo "Makefile commands disponibles:"
	@echo "  make sass        - Ejecuta Sass en modo watch (con mensaje para producción)"
	@echo "  make start       - Inicia Node.js en producción (npm start)"
	@echo "  make dev         - Inicia Node.js en modo desarrollo con nodemon"
	@echo "  make test-db     - Ejecuta pruebas de base de datos"
	@echo "  make db-backup   - Respaldar queries de la base de datos"
	@echo "  make ts-watch    - Inicia TypeScript en modo watch"
	@echo "  make all         - Ejecuta sass, ts-watch y dev (modo desarrollo completo)"

# Sass watch
sass:
	@echo "Para producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
	sass --watch --update ./frontend/src/scss/index.scss:frontend/public/css/styles.css

# Node.js scripts
start:
	npm --prefix backend run start

dev:
	npm --prefix backend run dev

test-db:
	npm --prefix backend run test:db

db-backup:
	npm --prefix backend run db:backup

# TypeScript watch
tsc:
	tsc --watch --project frontend/tsconfig.json

# Modo desarrollo completo: Sass + TypeScript + Nodemon
all:
	@echo "Iniciando modo desarrollo completo..."
	@echo "Sass, TypeScript watch y Nodemon se ejecutarán en paralelo..."
	# Usamos & para ejecutar en background y wait para no salir del makefile
	$(MAKE) sass &
	$(MAKE) ts-watch &
	$(MAKE) dev &
	wait
