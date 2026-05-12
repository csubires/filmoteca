# Filmoteca

![icons](/docs/assets/icons.svg)

Proyecto de micro-web personal para la gestión de una pequeña filmoteca (colección de películas), sacado a producción sobre un servidor local, y usando las siguientes tecnológias:

![films](/docs/assets/films.png)

Backend:
- VMWare Workstation Pro
- Ubuntu Server (CLI Mode)
- Docker (dockerfile, docker-compose)
- Nginx / UWSGI
- Python3 / Flask
- SQLite

Frontend:
- HTML
- CSS / SCSS
- JavaScript (Puro)
- Bash (gestión de imagenes, compresión, deploy etc)
- Jinja

Otros:
- Postman
- unittest

He intentado no dependender en lo posible de paquetes, framework, apis, módulos, etc de terceros. Ya que es un pequeño proyecto pero con la idea de que sea funcional y facilmente mantenible, he priorizado la rapidez en la instalación y producción, y el mínimo uso en recursos como el almacenamiento o CPU.

Por ello hago uso JavaScript puro (llamadas fetch), SCSS para agilizar la maquetación sin nada de BootStrap o similares, ni módulos adicionales de gestión de formularios para Flask.

La Base de Datos es un simple fichero `sqlite`.

La funcionalidad del proyecto entre otra es:
- Listado de archivos multimedia locales con extracción de datos como, extensión, fps, fecha, nombre, resolución, etc
- Comprobación de la integridad del inventariado mediante códigos hash
- Inserción, borrado y actualizado de entradas en la base de datos
- Logs

![menu](/docs/assets/menu.png)

Funcionalidad web:
- Obtención de más información y metadatos mediante scrapping web.
- Gestión de películas
- Responsive
- Busqueda de películas por distintos criterios
![search](/docs/assets/search.png)
- Panel de administración
![admin](/docs/assets/admin.png)
- Con opciones avanzadas
![advance](/docs/assets/advance.png)
- Estadísticas
- Varios menús de selección
![menu1](/docs/assets/menu1.png)
![menu2](/docs/assets/menu2.png)

Otros:
- Backup de la base de datos
