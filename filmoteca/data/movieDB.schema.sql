BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "deleted_movies" (
	"id_movie"	INTEGER,
	"title"	TEXT NOT NULL,
	"realtitle"	TEXT,
	"year"	INTEGER,
	"quality"	TEXT,
	"extension"	TEXT,
	"size"	INTEGER,
	"size_str"	TEXT,
	"duration"	INTEGER,
	"duration_str"	TEXT,
	"pathfile"	TEXT UNIQUE,
	"resolution"	TEXT,
	"fps"	REAL,
	"urldesc"	TEXT,
	"ratings"	REAL DEFAULT 0.0,
	"urlpicture"	TEXT,
	"censure"	INTEGER DEFAULT 0,
	"file_created"	TEXT,
	"report_date"	TEXT,
	"id_genre"	INTEGER NOT NULL,
	"id_subgenre"	INTEGER DEFAULT -1,
	"id_country"	INTEGER,
	"hdd_code"	INTEGER NOT NULL DEFAULT 99,
	FOREIGN KEY("id_country") REFERENCES "country"("id_country"),
	FOREIGN KEY("id_genre") REFERENCES "genre"("id_genre"),
	FOREIGN KEY("id_subgenre") REFERENCES "genre"("id_genre")
);
CREATE TABLE IF NOT EXISTS "report" (
	"id_report"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"report_date"	TEXT NOT NULL,
	"num_movies"	INTEGER,
	"num_genres"	INTEGER,
	"global_size"	INTEGER,
	"global_size_str"	TEXT,
	"global_duration"	INTEGER,
	"global_duration_str"	TEXT,
	"file_extensions"	TEXT,
	"add_recent"	INTEGER,
	"manual_stop"	INTEGER DEFAULT 0,
	"num_files"	INTEGER,
	"hdd_code"	INTEGER DEFAULT 0,
	"real_size"	TEXT
);
CREATE TABLE IF NOT EXISTS "user" (
	"id_user"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"name"	TEXT(4),
	"password"	TEXT,
	"ip"	TEXT,
	"agent"	TEXT,
	"date_time"	TEXT,
	"email"	TEXT,
	"role"	TEXT DEFAULT ('admin'),
	CONSTRAINT "user_UN" UNIQUE("name","email")
);
CREATE TABLE IF NOT EXISTS "rating" (
	"id_rating"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"src_img"	TEXT,
	"url"	TEXT,
	"title"	TEXT,
	"year"	INTEGER,
	"rating"	REAL,
	"is_present"	INTEGER DEFAULT (0),
	CONSTRAINT "rating_UN" UNIQUE("title","year")
);
CREATE TABLE IF NOT EXISTS "country" (
	"id_country"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"name"	TEXT NOT NULL UNIQUE,
	"code"	TEXT DEFAULT 'n/a',
	"flag"	TEXT
);
CREATE TABLE IF NOT EXISTS "movies" (
	"id_movie"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"title"	TEXT NOT NULL,
	"realtitle"	TEXT,
	"year"	INTEGER,
	"quality"	TEXT,
	"extension"	TEXT,
	"size"	INTEGER,
	"size_str"	TEXT,
	"duration"	INTEGER,
	"duration_str"	TEXT,
	"pathfile"	TEXT UNIQUE,
	"resolution"	TEXT,
	"fps"	REAL,
	"urldesc"	TEXT,
	"ratings"	REAL DEFAULT 0.0,
	"urlpicture"	TEXT,
	"censure"	INTEGER DEFAULT 0,
	"file_created"	TEXT,
	"report_date"	TEXT,
	"id_genre"	INTEGER NOT NULL,
	"id_subgenre"	INTEGER DEFAULT -1,
	"id_country"	INTEGER,
	"hdd_code"	INTEGER NOT NULL DEFAULT 99,
	FOREIGN KEY("id_country") REFERENCES "country"("id_country"),
	FOREIGN KEY("id_genre") REFERENCES "genre"("id_genre"),
	FOREIGN KEY("id_subgenre") REFERENCES "genre"("id_genre")
);
CREATE TABLE IF NOT EXISTS "genre" (
	"id_genre"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"name"	TEXT NOT NULL UNIQUE,
	"pathfolder"	TEXT NOT NULL UNIQUE,
	"num_movies"	INTEGER DEFAULT 0,
	"local_size"	INTEGER,
	"local_size_str"	TEXT,
	"local_duration"	INTEGER,
	"local_duration_str"	TEXT,
	"is_subgenre"	INTEGER DEFAULT 0,
	"hash_folder"	TEXT,
	"report_date"	TEXT
);
CREATE INDEX IF NOT EXISTS "movie_report_date" ON "movies" (
	"report_date"
);
CREATE INDEX IF NOT EXISTS "movie_pathfile" ON "movies" (
	"pathfile"
);
CREATE INDEX IF NOT EXISTS "movie_id_genre" ON "movies" (
	"id_genre"
);
CREATE TRIGGER delete_movie AFTER DELETE ON movies
BEGIN
	INSERT INTO deleted_movies VALUES (OLD.id_movie, OLD.title, OLD.realtitle, OLD.year, OLD.quality, OLD.extension, OLD.size, OLD.size_str, OLD.duration, OLD.duration_str, OLD.pathfile, OLD.resolution, OLD.fps, OLD.urldesc, OLD.ratings, OLD.urlpicture, OLD.censure, OLD.file_created, OLD.report_date, OLD.id_genre, OLD.id_subgenre, OLD.id_country, OLD.hdd_code);
END;
COMMIT;
