#!/bin/bash

# Crear el contenedor de NGINX
echo -e "\n\tCREANDO IMAGE NGINX-SERVER\n"
# ! Se crea en el docker-compose
# docker build -t nginx-flask ./nginx-flask

# Crear el contenedor de PYTHON + FLASK
echo -e "\n\tCREANDO IMAGE FLASK-SERVER\n"
docker build -t filmoteca-flask ./filmoteca-flask

# Mostrar imagenes
echo -e "\n\tMOSTRANDO ESTADO\n"
docker images | egrep "*-flask"

# Copiando docker-compose.yml a el root del proyecto
cp docker-compose.yml ../..

# Mostrar sugerencia
echo -e "\n\tPara ver logs de container usar: docker logs --details flask-server"
echo -e "\tPara entrar dentro de un container usar: docker exec -it flask-server sh"
echo -e "\tPara desplegar docker compose usar: docker-compose up -d\n"
