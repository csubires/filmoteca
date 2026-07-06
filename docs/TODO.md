## TODO (Hay otros en el código)

- [ ] Generar Documentación con Assets
- Comprobar nombre de archivo en python y alertar si hay espacios de mas, o corchetes sin cerrar etc
- Update where gente = 1, en vez de ir uno a uno
- En torrent poder elegir collumnas y sacar listado links
- Normaliza funciones, clases, snake_case o como sea más estandar
---

postgres
https://github.com/psycopg/psycopg2
https://www.removepaywall.com/search?url=https://medium.com/@eng.fadishaar/step-by-step-guide-configuring-nginx-with-https-on-localhost-for-secure-web-application-testing-c78febc26c78
muñiz
https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu
https://medium.com/@rangabashyam22/nginx-and-python-flask-how-to-scale-secure-and-optimize-your-web-applications-7069947afa87

https://stackoverflow.com/questions/22432826/best-practice-for-setting-up-flaskuwsginginx
https://monicalent.com/blog/2013/12/06/set-up-nginx-and-uwsgi/
dockerignore
https://loadforge.com/guides/deploying-flask-applications-with-gunicorn-and-nginx-for-scalability
cProfile
SQL profiler to identify slow queries
ORM like SQLAlchemy
https://loadforge.com/guides/deploying-flask-applications-with-gunicorn-and-nginx-for-scalability

### APLICACIÓN PRINCIPAL

- [x] Arreglar el setup.py
- [x] Refactorización
models.py o entities.py
: Definir modelos de datos (clases) que utilizarán en el proyecto. `Ex: unaPelicula`
:La idea es crear una capa que trabaje sobre el mismo objeto para no llenar memoria, asegurandose de que se limpia cada vez que se "crea"

``` python
obj = PeliculaBuilder()
class PeliculaBuilder() {
	NOT_TRIMM_ATTRIBUTE =  ['path']
	dbt = new...
	return self

	obj = {
	name: 3333
	extension: ...
	}

@singleton
def __init__
	clear obj
def trim ...

def addAtributes(dic)
	obj.append()

def exitInBD(path)

def saveBD()
	self.trim...
	dbs.insert
}
```

.py -- browser implementa> service.py --- core > repository (sql + models)

run.py o server.py > controller.py
controller.py /paginaindex.html
service.py -> browser
## Server
- [ ] activar y configurar ufw
- [ ] Mejorar seguridad nginx
- [ ] Añadir servicios a fail2ban
- [ ] Configurar grafana
- [ ] Configurar otros
- [ ] implementar borntoberotc y meter en grafana
- [ ] Nextcloud news configurar
- [ ] Arreglar en el dockerfile build
*** WARNING: you are running uWSGI as root !!! (use the --uid flag) ***

- [X] cartelera sigue sin actualizar por fecha flask
- [X] show or change fecha default=datetime.now not (), modo ejecu
- [X] el tema de la cuenta admin
- [X] aumenta  size font purple
- [ ] Asegúrate de que todos los archivos de tu página web (HTML, CSS, etc.) estén guardados con la codificación UTF-8.

- [X] En el script de reduce imagen descartar .regex los .cmp.jpg
- [X] Crear carpeta uTest de pruebas unitarias.
Crear una bd que se carge en memoria con valores ficticios.
Probar pytest

- ~~[ ] Opción show config en help~~
- [ ] Diferenciar partes MVC, API REST.
MVC se diferencia de API REST y es mejor dividirlos usando "BluePrint"
    * https://stackoverflow.com/questions/15231359/split-python-flask-app-into-multiple-files
    * https://docs.python-guide.org/writing/structure/

- [ ] Crear carpeta de pruebas usando la herramiento `PostMan`. Probar plugin error 401 json return
- [x] Comprobar la conexión a los servidores de Internet antes de intentar actualizar.
- [X] GIT ignore *.db-backup *.jpg

- [x] Purgar sql queries.py, usar find sh script
Catalogar Queries por aparición en archivos: archivo.js, core.py.. etc

- [x] Almacenar la estructura de la base de datos en database_build.txt
- ~~[ ] Calcular mediana, mejorar las estadisticas~~
- [ ] Empaquetar proyecto como /src setup.py
- [ ] Hacer que se detecten los cambios de películas entre carpetas (evitar redescargar metadatos)
- [ ] Buscar alternativa a filmaffinity service_filmmafinity.py, service_otro.py
- [X] Mostrar un mensaje de "no encontrado ningun elemento" en mantenimiento al no obtener pelis, pais, etc
- [x] rating is present script check
---
### SERVIDOR WEB
- [x] Copiar listado a portapapeles
- [x] Generar avatar para subgeneros y géneros
- [x] Mejorar el modo en que se muestra el listado de películas peor valoradas haciendolo más útil (orden alfabetico, / agrupación por géneros)
- [-] Ordenar peor valoradas por porcentajes de género, para penalizar Drama u otros con sobreabundancia de películas
- [x] Poder pasar facilmente una película de un género a otro moviendo la imagen
- [x] El enlace de subgéneros no lleva a nada, Hacer una busqueda de pelís de ese subgénero
- [x] Añadir a mantenimiento géneros sin ninguna película
- [x] Si no existe el string de error hacer `get(stringBD, "Ocurrio un error no registrado")`
- [ ] Mejora security api rest con roles admin, registred, y user visitante
- [ ] Crear una función token apiSecurity que maneje los tokens y roles
- [ ] jwt no es x-xsrf-token cors
: Tokens para usar la API REST y Tokens para impedir acceso desde otros "host"
: Authorization: Bearer access_token
- [x] Mejorar gráficas
- [x] Configurar seguridad server_config.py
- [x] Sugerir películas a descargar por año + cache > 7 starts
- ~~[ ] Jinja respuestas, Javascript JSon Unificar tipo de respuesta API no javascript~~
- [x] Si las caches siempre se llena 1 vez, simplificar los if
- ~~[ ] Opción de copiar nombre para usarlo en buscadores~~
- [x] Script para empaquetar/comprimir archivos de imagen en un rar para subir a gitea
- [ ] Traer 100 películas jinja y lo demas renderizado en paquetes por JavaScript
- ~~[ ] Evitar robo de imagenes o texto ~~
- [x] Detector de link rotos.. 404 image not found
- [ ] Mejorar la seguridad y testearla
- [x] Atributos path y httpOnly de la cookie no configurados en la aplicación
- [ ] Decorator token_required('name') para PUT DELETE
** https://github.com/VanNgoc1102/Flask/blob/master/src/security/security.py
https://stackoverflow.com/questions/15231359/split-python-flask-app-into-multiple-files
- [ ] VER DESPIEZE CONTROLER
https://github.com/chrischase011/simple_flask

---
### GLOBAL
- Revisar la seguridad
- Revisar los errores a la hora de mandar peticiones
- Revisar y control de datos
- [x] Añadir logeo, acceso, real con contraseña en BD, cambiar , crear cuenta
- [x] Refactorizar manejo de imagenes y archivos
- [x] Refactorizar manejo de errores y mensajes
- Refactorizar busqueda avanzada
- ~~Macro para global.html reports ???~~
- ~~Macro para generar card-genre ???~~
- Implementar recordar contraseña
- Refactorizar Javascript fillDataList
---
### MEJORAS

- [ ] multiples origin
- preparar projectos en python e ir subiendo a github
acer corte < 5 y mandar a trash juzgar
- [ ] Opción web pasar a eliminadas
- [ ] En el listado de peores películas marcar las nuevas para cortar a EX y evitar el recopiado
- [ ] Crear un script para copia automática de películas script robocopy automatic???
- [x] Mejorar y añadir gráficos
- Mejorar honeypot
- Cookie y privacidad
- Implementar cache, evitar remandar css, js, iconos desde cliente
- [x] Poner elegir el listado por orden de nombre o año, duracion, estrellas (eso requiere listado javascript o no?)
- [ ] viewport virtual scroll
- INSERT INTO t0(c) VALUES(random()) RETURNING *;
- pasar pelis borradas a una tabla nueva ??
- [ ] .gitignore para desarrollo y para producción
- [ ] Web alternativa para consegir datos cine.com
- [ ] Añadir imagen del bandera en estadisticas pais. Leyenda mapa + bandera

---
### CSS
- [ ] linear gradiend en search
- [X] Meter los mensajes poppup por encima del dialog (form update film)
- [X] Cuando haces una busqueda y el cursos sale de text al intentar darle al boton buscar, acabas dandole a borrar texto
- [ ] Agrupar todas las opciones para una pelí en un icono con li, o select
- [ ] En vez de botones tool edit un list icon con ver, editar borrar solo para admins
- [ ] Tipografia responsive
- [ ] Dar animación y efectos al estilo
- [ ] Mejorar tiempo de carga imagen.gif - Mejorar pantalla de espera: Cargando, wait...
- [ ] Form position sticki??
- [ ] Comprobar si :root:has(-checked) está disponible en los nuevos navegadores
- [@] Mejorar modo oscuro
- [@] Mejorar modo móvil, tablet, normal, pantalla grande @queri-media
- [ ] Botón salir del menú queda feo
- [ ] Mejorar los colores
---

## JAVASCRIPT
- [ ] Cuando se le de a ordenar por título que en vez de aparecer años aparezca alfabeto
- [ ] main.js crear un bucle para all_data fillData, refactorizar
- [ ] chartjs.js Generar los gráficos de las estadísticas mediante javascript
- [ ] se ha jodido el mapa en estadisticas ??
---

## ERRORES
- [ ] al compartir modulo connecion coge configuracion de module ????
- [ ] 504 Gateway time-out al esperar a que cargue cartelera
- [ ] Los globos de alerta se quedan atrás al modificar una película (zindex). ¿Crear sass jerarquía de zindex?
- [ ] Cuando se habre el listado de peores películas y antes has volteado una tarjeta de película, está aparece encima de todo (indexz)
- [X] listado y descargar se unen
- [X] Cuando no se devuelven busquedas en buscador salta error con cada tecla que se pulsa
- [ ] Hay un problema a la hora de pasar timestamp a horas, da números de 5, 9 horas una película. Hacer script y corregir. Ver en Windows por qué se obtiene mal. Ver time to secon, y filemetadata
- [X] Cuando de hace update en INTERNO, aparecen todas las pelis de EXTERNO como desaparecidas (FECHA EN EXTERNO no se actualiza???)
NO el problema es que has puesto la fecha como UNIQUE y hace un reporte de external o internal en el mismo día se pisen (ARREGLADO PERO COMPROBAR)
- [X] Problemas al obtener secret key en producción  RuntimeError: The session is unavailable because no secret key was set.
- [-] Error al clonar no encuentra www/logs
- [X] vuelta ciclista al descargar inet... error ..
- [x] No se puede cerrar las pelis abiertas"" si no estas logeado
- [x] En datos globales aparece 2 veces EXTERNO(1)
- [x] Películas no encontradas Salen demasiadas en Extern
- [X] Mensaje de error pelicula no puedo actualizar cuando en realidad sí se ha ...
- [X] La primera vez que se rellenan los datalist no se auto- [ ]seleccionan al rellenar el formulario
- [X] A veces al abrir 2 veces edit consecutivas o sin eso aparece pantalla en blanco y no carga el form
- [ ] Si el POST está vacio, no aplicar update ???, o sobreescribirá datos importantes
- [X] Añadir pruebas unitarias, de integracion, y funcionales
- [X] Objeto simulado para las pruebas de error
- [-] Algunos subgeneros no contabilizan num peliculas, ni size?????? PROBLEMAS VERSION SQLITE
- [x] Editar no funciona en mantenimiento (no aparece el form)
- [x] Problema JSON error cuando se usa el buscador principal y no encuentra un match película
- [x] Error al no encontrar directorio
- [X] inet pelicula comprobar antes si hay internet
- [ ] cuando el pais no esta en la bd da error
{'id_movie': 1518, 'title': 'El caftán azul', 'realtitle': 'The Blue Caftan', 'urldesc': '/es/film999656.html', 'ratings': 7.2, 'urlpicture': '/the_blue_caftan-747001033-mmed.jpg', 'country': 'Marruecos', 'id_country': None, 'year': 2022}  'NoneType' object is not subscriptable
 [4/4]  [✖] Error complete_films(). Failed to update movie  (1518, 'El caftán azul', 18, None, 2022, '/es/film999656.html')
[✖] Error update_film()  {'id_movie': 1548, 'title': 'Los guardianes de la fórmula', 'realtitle': 'Cuvari formule', 'urldesc': '/es/film184482.html', 'ratings': 6.2, 'urlpicture': '/cuvari_formule-674562975-mmed.jpg', 'country': 'Serbia', 'id_country': None, 'year': 2023}  'NoneType' object is not subscriptable
 [4/4]  [✖] Error complete_films(). Failed to update movie  (1548, 'Los guardianes de la fórmula', 18, None, 2023, '/es/film184482.html')


---
## TEST
* Al mostrar la busquedad general de películas tiene límite???, Quitar límite
* Los datos int se parsean automaticamente de str a int al guardar en sqlite????
* Comprobar que las estadísticas de géneros son reales
* python3 -m cProfile test_utils.py
---
## SUGERENCIAS
- Crear Makefile
- matploit 366 Imagenes en SVG, o escalable + 533 media de duracion , tamaño
- Comprimir imagenes desde aplicación, compressimage como opción .popen pag449
- Listados de películas a PDF
- ORM SQL  headers_orm(model)
- En la API REST lanzar throws y capturar fuera
``` python
    if status code == 404:
	    raiser Exception('visitusr', 'No encontrado')
    try:Exception as e:

        e.add_note('Add some information')

        raise Exception('spam', 'eggs')

    except Exception as inst:

	    lg_ 'ry', instt.args

        print(type(inst))    # the exception instance

        print(inst.args)     # arguments stored in .args

```

> Args:
> Returns:
> Raises:


## DOCKER
Permanencia de archivos
Pasar webs a /var/wwww
Multiples webs en distintos puertos?
1 servidor varias webs
Estresas la web
Buscar vulnerabilidades

* Crear un CD/CI con gitea
https://aprendeit.com/como-montar-un-gitea-con-ci-cd-con-drone/
https://dev.to/ruanbekker/self-hosted-cicd-with-gitea-and-drone-ci-200l
https://blog.ruanbekker.com/blog/2021/03/09/cicd-with-droneci-and-gitea-using-docker-compose/

---


https://tailwindui.com/components/application-ui/navigation/pagination
https://www.clubdetecnologia.net/blog/2020/buenas-practicas-de-seguridad-para-las-api-rest/
https://github.com/Open-Bootcamp/docker
https://stackoverflow.com/questions/45732458/ignore-files-committed-to-git-and-also-remove-them-from-history
https://codepen.io/ndangelo/pen/BaamRam
https://github.com/purecatamphetamine/country-flag-icons/tree/gh-pages/1x1
https://noticiasseguridad.com/tutoriales/como-proteger-cualquier-servidor-linux-proteccion-automatizada-de-servidor/
