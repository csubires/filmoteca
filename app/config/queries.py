TAG_QUERY = {
	# Local
	'hash_in_db': 'SELECT id_genre FROM genre WHERE hash_folder = :hash_folder AND pathfolder = :pathfolder',
	'update_date_movies': 'UPDATE movies SET report_date = :report_date WHERE id_genre = :id_genre OR id_subgenre = :id_genre AND hdd_code = :hdd_code',
	'update_date_folder': 'UPDATE genre SET hash_folder = :hash_folder, report_date = :report_date WHERE pathfolder = :pathfolder',
	'file_in_db': 'SELECT * FROM movies WHERE pathfile = :pathfile',
	'update_date_file': 'UPDATE movies SET report_date = :report_date, hdd_code = :hdd_code WHERE pathfile = :pathfile',
	'get_id_genre': 'SELECT id_genre FROM genre WHERE name = :name',
	'get_id_genre_by_path': 'SELECT id_genre FROM genre WHERE pathfolder = :pathfolder',
	'insert_genre': 'INSERT INTO genre (name, pathfolder, is_subgenre, hash_folder, report_date) VALUES (:name, :pathfolder, :is_subgenre, :hash_folder, :report_date)',
	'insert_movie': 'INSERT INTO movies (title, year, quality, extension, size, pathfile, duration, resolution, fps, file_created, report_date, id_genre, id_subgenre, size_str, duration_str, hdd_code) VALUES (:title, :year, :quality, :extension, :size, :pathfile, :duration, :resolution, :fps, :file_created, :report_date, :id_genre, :id_subgenre, :size_str, :duration_str, :hdd_code)',
	# Estadísticas
	'update_genre': 'UPDATE genre SET num_movies = (SELECT COUNT(*) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre) AND movies.report_date = :report_date), local_size = (SELECT SUM(size) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre) AND movies.report_date = :report_date), local_duration = (SELECT SUM(duration) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre) AND movies.report_date = :report_date)',
	'get_all_genre': 'SELECT * FROM genre',
	'update_str_genre': 'UPDATE genre SET local_size_str = :local_size_str, local_duration_str = :local_duration_str WHERE id_genre = :id_genre',
	'insert_report': 'INSERT INTO report (report_date, num_movies, num_genres, global_size, global_duration, file_extensions, add_recent, manual_stop, num_files, hdd_code, real_size) VALUES (:report_date, (SELECT COUNT(*) FROM movies WHERE report_date = :report_date AND hdd_code = :hdd_code), (SELECT COUNT(*) FROM genre), (SELECT SUM(size) FROM movies WHERE report_date = :report_date AND hdd_code = :hdd_code), (SELECT SUM(duration) FROM movies WHERE report_date = :report_date AND hdd_code = :hdd_code), :report_ext, (SELECT COUNT(*) FROM movies WHERE file_created > (SELECT MAX(report_date) FROM report) AND hdd_code = :hdd_code), :manual_stop, :num_files, :hdd_code, :real_size)',
	'get_report_info': 'SELECT * FROM report ORDER BY report_date DESC LIMIT 1',
	'update_str_report': 'UPDATE report SET global_size_str = :global_size_str, global_duration_str = :global_duration_str WHERE report_date = :report_date',
	# Internet
	'get_incompletes': 'SELECT id_movie, title, id_genre, id_subgenre, year, urldesc FROM movies WHERE urldesc IS NULL OR realtitle IS NULL OR id_country IS NULL OR ratings IS NULL OR urlpicture IS NULL AND censure = 0',
	'get_name_genre': 'SELECT name FROM genre WHERE id_genre = :id_genre AND is_subgenre == :is_subgenre',
	'country_byname': 'SELECT id_country FROM country WHERE name = :name',
	'insert_country': 'INSERT OR IGNORE INTO country (name) VALUES (:name)',
	'update_movie': 'UPDATE movies SET urldesc = :urldesc, realtitle = :realtitle, id_country = :id_country, ratings = :ratings, urlpicture = :urlpicture WHERE id_movie = :id_movie',
	# Limpieza
	'get_urlpicture': 'SELECT id_movie, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END, urlpicture FROM movies WHERE urlpicture IS NOT NULL',
	'exists_urlpicture': 'SELECT id_movie FROM movies WHERE urlpicture = :urlpicture AND (id_subgenre = :id_genre OR id_genre = :id_genre)',
	# RATING
    'set_rating': 'INSERT OR IGNORE INTO rating (src_img, url, title, year, rating) VALUES (:src_img, :url, :title, :year, :rating)',
	'set_present': 'UPDATE rating SET is_present=1 WHERE (title, year) IN (SELECT title, year FROM rating INTERSECT SELECT title, year FROM movies)',
}

TAG_QUERY_REPORT = {
	# Listados
	'movies_by_genre': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE (id_genre = :id_genre OR id_subgenre = :id_genre) AND censure = 0 ORDER BY year DESC, title ASC LIMIT :limit OFFSET :offset',
	'movies_by_genre_count': 'SELECT COUNT(*) as total FROM movies WHERE (id_genre = :id_genre OR id_subgenre = :id_genre) AND censure = 0',
	'last_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN M.id_subgenre IS NULL THEN M.id_genre ELSE M.id_subgenre END, genre.name FROM movies AS M INNER JOIN genre ON genre.id_genre = M.id_genre ORDER BY file_created DESC, year ASC, title LIMIT :limit',
	'search_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE title LIKE :search OR realtitle LIKE :search OR year = :year ORDER BY year, title LIMIT :limit',
	'get_report_info': 'SELECT * FROM report WHERE report_date = (SELECT MAX(report_date) FROM report WHERE hdd_code=0) UNION SELECT * FROM report WHERE report_date = (SELECT MAX(report_date) FROM report WHERE hdd_code=1) ORDER BY hdd_code',
	'get_all_genre': 'SELECT * FROM genre',
	'recommended': 'SELECT m.id_movie, m.title, m.year, m.duration_str, m.ratings, m.urlpicture, CASE WHEN m.id_subgenre IS NULL THEN m.id_genre ELSE m.id_subgenre END, g.name FROM movies m INNER JOIN genre g ON m.id_genre = g.id_genre WHERE m.ratings > 6.6 ORDER BY RANDOM() LIMIT 10',
	# Mantenimiento
	'get_all_report': 'SELECT * FROM report ORDER BY hdd_code ASC, report_date DESC',
	'repeated_movies': 'SELECT a.id_movie, a.title, a.year, a.duration_str, a.ratings, a.urlpicture, CASE WHEN a.id_subgenre IS NULL THEN a.id_genre ELSE a.id_subgenre END FROM movies a INNER JOIN (SELECT title FROM movies GROUP BY title HAVING COUNT(*) > 1) b ON a.title = b.title ORDER BY a.title',
	'missing_movies_hdd0': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE report_date <> (SELECT MAX(report_date) FROM report WHERE hdd_code = 0) AND hdd_code = 0',
	'missing_movies_hdd1': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE report_date <> (SELECT MAX(report_date) FROM report WHERE hdd_code = 1) AND hdd_code = 1',
	'incomplete_movie_info': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE year IS NULL OR size IS NULL or duration IS NULL OR urldesc IS NULL OR id_country IS NULL',
	'censured_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE censure = 1',
	'devalued_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, (CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END) AS idgenre, pathfile FROM movies WHERE ratings < 6.5 AND hdd_code = 0 ORDER BY idgenre, ratings ASC',
	'shit_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, (CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END) AS idgenre, pathfile FROM movies WHERE ratings < 4.5 ORDER BY ratings ASC',
	'corrupt_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END FROM movies WHERE size < 100 ORDER BY size ASC',
	'overevalued_movies': 'SELECT id_movie, title, year, duration_str, ratings, urlpicture, (CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END) AS idgenre, pathfile FROM movies WHERE ratings > 6.7 AND hdd_code = 1 ORDER BY idgenre, ratings DESC',
	'get_all_genre': 'SELECT id_genre, name FROM genre WHERE is_subgenre = 0',
	'incomplete_genre': 'SELECT id_genre, name, pathfolder, is_subgenre FROM genre WHERE num_movies = 0',
	# JavaScript SCRUD
	'get_movie': 'SELECT * FROM movies WHERE id_movie = :id_movie',
	'get_all_genres': 'SELECT id_genre, name FROM genre WHERE is_subgenre = 0',
	'get_all_subgenres': 'SELECT id_genre, name FROM genre WHERE is_subgenre = 1',
    'get_all_pathgenres': 'SELECT id_genre, pathfolder FROM genre',

	'select_country': 'SELECT id_country, (flag || " " || name || " (" || code || ")") AS name FROM country ORDER BY name',
	'modify_movie': 'UPDATE movies SET censure = :censure, duration = :duration, duration_str = :duration_str, fps = :fps, id_country = :id_country, pathfile = :pathfile, quality = :quality, ratings = :ratings, realtitle = :realtitle, resolution = :resolution, size = :size, size_str = :size_str, title = :title, urldesc = :urldesc, urlpicture = :urlpicture, year = :year, id_genre = :id_genre, id_subgenre = :id_subgenre, hdd_code = :hdd_code, extension = :extension WHERE id_movie = :id_movie',
	'update_inet_movie': 'SELECT id_movie, title, id_genre, id_subgenre, year, urldesc FROM movies WHERE id_movie = :id_movie',
	'extra_info_movie': 'SELECT id_movie, realtitle, quality, extension, size_str, urldesc, urlpicture, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END, country.code AS id_country, country.name, hdd_code, country.flag FROM movies LEFT JOIN country ON movies.id_country = country.id_country WHERE movies.id_movie = :id_movie',
	'delete_report': 'DELETE FROM report WHERE id_report = :id_report',
	'set_code_country': 'UPDATE country SET code = :code, flag = :flag WHERE id_country = :id_country',
	# Duplicado justificado
	'get_name_genre': 'SELECT name FROM genre WHERE id_genre = :id_genre',
	'country_byname': 'SELECT id_country FROM country WHERE name = :name',
	'get_urlpicture': 'SELECT id_movie, CASE WHEN id_subgenre IS NULL THEN id_genre ELSE id_subgenre END, urlpicture FROM movies WHERE urlpicture IS NOT NULL',
	'update_movie': 'UPDATE movies SET urldesc = :urldesc, realtitle = :realtitle, id_country = :id_country, ratings = :ratings, urlpicture = :urlpicture WHERE id_movie = :id_movie',
	'insert_country': 'INSERT OR IGNORE INTO country (name) VALUES (:name)',
	# RATING
	'set_present': 'UPDATE rating SET is_present=1 WHERE id_rating = :id_rating',
	'get_rating': 'SELECT id_rating, src_img, url, title, year, rating, is_present FROM rating WHERE year is :year ORDER BY rating DESC',
	'get_years': 'SELECT DISTINCT year, COUNT(*) FROM rating WHERE is_present=0 GROUP BY year ORDER BY year DESC',
	# TORRENT
	'select_urlend': 'SELECT url_end, date_end, npseries FROM data WHERE id_data = 0',
	'update_urlend': 'UPDATE data SET url_end = :url_end, date_end = :date_end, npseries = :npseries WHERE id_data = 0',
}

# OPTIMIZACIONES PARA SQLITE 3.45.1:
# - Las queries han sido limpiadas eliminando código no utilizado
# - Se recomienda crear índices en columnas frecuentemente consultadas:
#   CREATE INDEX idx_movies_genre ON movies(id_genre, id_subgenre);
#   CREATE INDEX idx_movies_report_date ON movies(report_date, hdd_code);
#   CREATE INDEX idx_movies_title ON movies(title);
#   CREATE INDEX idx_genre_name ON genre(name);
#   CREATE INDEX idx_country_name ON country(name);
# - La query update_genre usa subqueries optimizadas para la versión actual
# - Las queries de mantenimiento han sido simplificadas para mejor rendimiento
