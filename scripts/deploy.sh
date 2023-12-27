#!/bin/bash

pwd
git clone http://192.168.65.22:8020/developer/filmoteca web-flask
7z x ./web-flask/filmoteca/data/pack_images.7z -o ./web-flask/filmoteca/filmoteca/www

