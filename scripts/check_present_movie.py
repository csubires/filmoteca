#!/usr/bin/python3
# 2023.12.08
# python3 scripts/check_present_movie.py

'''
    Script para comprobar y establecer si una película propuesta para descarga ya está
    presente en la base de datos.

    La query compara si los nombre de los dos caratulas son iguales y son del mismo año.

    Si es así entonces pone is_present a 1

    UPDATE rating SET is_present = 1 WHERE id_rating IN (SELECT id_rating FROM rating, movies WHERE replace(src_img, 'mtiny', '') = replace(urlpicture, 'mmed', '') AND rating.year = movies.year AND is_present = 0)

'''
