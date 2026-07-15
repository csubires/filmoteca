#!/usr/bin/env bash

kitty @ launch --type=tab --tab-title MAKE --cwd $PWD bash -c "make web-gateway; exec bash"
kitty @ launch --location=vsplit --cwd $PWD bash -c "make web-database; exec bash"
kitty @ launch --location=vsplit --cwd $PWD bash -c "make web-auth; exec bash"
kitty @ launch --location=hsplit --cwd $PWD bash -c "make web-i18n; exec bash"
kitty @ launch --cwd $PWD bash -c "python3 app/adapter/api.py; exec bash"

echo "¿Deseas ejecutar los transpiladores? (s/n)"
read -r respuesta

if [[ "$respuesta" =~ ^[Ss]$ ]]; then
 @ launch --type=tab --tab-title MAKE2 --cwd $PWD bash -c "make sass; exec bash"
kitty @ launch --location=hsplit --cwd $PWD bash -c "make tsc; exec bash"
else
    echo "Bloque omitido."
fi
#kitty
