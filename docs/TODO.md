## TODO (Hay otros en el código)
---
### Aplicación principal

- [ ] Arreglar el setup.py
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

---
### Modo servidor Web
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
- [ ] Script para empaquetar/comprimir archivos de imagen en un rar para subir a gitea
- [ ] Ordenar peor valoradas por porcentajes de género, para penalizar Drama u otros con sobreabundancia de películas
- [ ] Traer 100 películas jinja y lo demas renderizado en paquetes por JavaScript
- ~~[ ] Evitar robo de imagenes o texto ~~
- [x] Detector de link rotos.. 404 image not found
- [ ] Mejorar la seguridad y testearla
- [x] Atributos path y httpOnly de la cookie no configurados en la aplicación
- [ ] Generar avatar para subgeneros y géneros
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
- Refactorizar manejo de imagenes y archivos
- Refactorizar manejo de errores y mensajes
- Refactorizar busqueda avanzada
- ~~Macro para global.html reports ???~~
- ~~Macro para generar card-genre ???~~
- Implementar recordar contraseña
- Refactorizar Javascript fillDataList
---
### MEJORAS
- [x] Mejorar y añadir gráficos
- Mejorar pantalla de espera: Cargando, wait...
- Mejorar honeypot
- Cookie y privacidad
- Implementar cache, evitar remandar css, js, iconos desde cliente
- Poner elegir el listado por orden de nombre o año, duracion, estrellas (eso requiere listado javascript o no?) viewport virtual scroll
- Generar automaticamente la foto de subgeneros?, 
- INSERT INTO t0(c) VALUES(random()) RETURNING *;
- pasar pelis borradas a una tabla nueva ??
---
## ESTILOS
- [X] Cuando haces una busqueda y el cursos sale de text al intentar darle al boton buscar, acabas dandole a borrar texto
- [ ] Agrupar todas las opciones para una pelí en un icono con li, o select
- [ ] En vez de botones tool edit un list icon con ver, editar borrar solo para admins
- [ ] Tipografia responsive
- [ ] Dar animación y efectos al estilo
- [ ] Mejorar tiempo de carga imagen.gif
- [ ] Form position sticki??
---
### CSS
- Mejorar modo oscuro
- Mejorar modo móvil, tablet, normal, pantalla grande @queri-media
- Botón salir del menú queda feo
---
## ERRORES
- [ ] vuelta ciclista al descargar inet... error ..
- [x] No se puede cerrar las pelis abiertas"" si no estas logeado
- [x] En datos globales aparece 2 veces EXTERNO(1)
- [x] Películas no encontradas Salen demasiadas en Extern
- [X] Mensaje de error pelicula no puedo actualizar cuando en realidad sí se ha ...
- [X] La primera vez que se rellenan los datalist no se auto- [ ]seleccionan al rellenar el formulario
- [X] A veces al abrir 2 veces edit consecutivas o sin eso aparece pantalla en blanco y no carga el form
- [ ] Si el POST está vacio, no aplicar update ???, o sobreescribirá datos importantes
- [X] Añadir pruebas unitarias, de integracion, y funcionales
- [X] Objeto simulado para las pruebas de error
- [ ] Algunos subgeneros no contabilizan num peliculas, ni size?????? PROBLEMAS VERSION SQLITE
- [x] Editar no funciona en mantenimiento (no aparece el form)
- [x] Problema JSON error cuando se usa el buscador principal y no encuentra un match película
- [x] Error al no encontrar directorio

---
## TEST
* Al mostrar la busquedad general de películas tiene límite???, Quitar límite 
* Los datos int se parsean automaticamente de str a int al guardar en sqlite????
* Comprobar que las estadísticas de géneros son reales
* python3 -m cProfile test_utils.py
---
## SUGERENCIAS
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



