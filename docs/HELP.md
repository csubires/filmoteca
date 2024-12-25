

## Crear y usar un entorno virtual
```
virtualenv -p python3 .venv
source .venv/bin/activate
install -r requirements.txt
pip3 freeze requirements.txt
deactivate
```

## Crear setup
```
python3 setup.py sdist
python3 setup.py install
python3 setup.py develop
python3 setup.py build
```


[Configurar Flask](https://runebook.dev/es/docs/flask/config/index)

# cat /dev/urandom | LANG=C tr -dc '[:alnum:]' | head -c 32 ; echo

## Descompromir imagenes en carpeta desde git

cd ../data or mv images ../filmo .....
7z x ./pack_images.7z -o../filmoteca/www




Montar y ejecutar contenedores para el servidor de películas

Ejecutar start.sh o hacer manualmente cada tarea

Por como está creado el archivo dockerfile de films_report es necesario que:
wsgi.ini este dentro de films_report
requirements.txt este fuera de films_report
Revisa los requirements.txt y las versiones de los modulos

Primero se crean los container a partir de las imagenes

                               IMAGENES (docker images)

docker-app_flask   latest              c72071283d9d   16 minutes ago   232MB
docker-app_nginx   latest              9aa34291121b   17 minutes ago   23.4MB
python             3.10.4-alpine3.15   2c167788a673   8 months ago     47.8MB
nginx              1.21.6-alpine       51696c87e77e   9 months ago     23.4MB

                                CONTENEDORES (docker ps)

c63d3479130c   docker-app_flask:latest   "uwsgi wsgi.ini"         44 minutes ago   Up 44 minutes   5000/tcp             flask-server
95f902ab5c4b   docker-app_nginx:latest   "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:80->80/tcp   nginx-server

A partir de las imagenes base python y nginx descargadas de Internet, se crean y configuran docker-app_flask y docker-app_nginx
docker-compose.yml se encarga de usar (image) docker-app_flask y docker-app_nginx ya creadas (build) anteriormente

A la hora de descargar e instalar algo dentro de un contenedor levantarlo usando --network=host o puede que de problemas

dockerfile x2:
    el exterior es para el servidor FLASK y el de nginx-flask para el servidor NGINX. Es importante el directorio donde se alojan


# -------------------------------
    INSTALACIÓN
# -------------------------------

- Copiar en esta carpeta films_report
- copiar dentro si no está ya wsgi.ini
- En el dockerfile se establece el archivo inicial que arranca el programa ARG UWSGI_APP=server ---> server.py
dentro de server.py está el modulo Flask module = $(UWSGI_APP):application ----> from www.app import app as application
- La configuración de Flask está en /films_report/www/config.py
- En teoría se crea un volume /films_report con el cual los cambios en la web se hacen permanentes, pero como se necesita copiar
la carpeta dentro del container, cada vez que se quiera actualizar la web hay que crear el container (build)
- Con lo cual tendrás que buscar la forma de mantener los cambios permanentes a la vez que actualizas la web
