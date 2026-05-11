#!/bin/bash
echo "Para producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
sass --watch --update ../filmoteca/server/static/sass/index.scss ../filmoteca/server/static/css/main.css
