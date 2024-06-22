#!/bin/bash

echo "¡IMPORTANTE!: DEBIDO A UN ERROR EN FLASK HAY QUE METER EL SECRET_KEY EN CONTROLER.PY"
echo "app.config['SESSION_TYPE'] = 'memcached'"
echo "app.config['SECRET_KEY'] = 'super secret key'"

cd web-flask
pwd

git clone http://192.168.65.22:8020/developer/filmoteca
7z x "./filmoteca/data/pack_images.7z" -o"./filmoteca/filmoteca/www"
