#!/bin/bash
echo "Para producción ejecutar \"sass --watch example.scss:example.css --style compressed\""
sass --watch --update ../filmoteca/www/static/sass/index.scss ../filmoteca/www/static/css/main.css