-- country definition

CREATE TABLE "country" (
	"id_country"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"name"	TEXT NOT NULL UNIQUE,
	"code"	TEXT DEFAULT 'n/a',
	"flag"	TEXT
);


-- "data" definition

CREATE TABLE "data" (
	url_end TEXT,
	date_end TEXT,
	"id_data" INTEGER NOT NULL
, npseries INTEGER DEFAULT (1));


-- "torrent_cache" definition - Cachea torrents encontrados por día

CREATE TABLE "torrent_cache" (
	"id_torrent_cache" INTEGER PRIMARY KEY AUTOINCREMENT,
	"date_cached" TEXT NOT NULL UNIQUE,
	"movies_json" TEXT,
	"series_json" TEXT,
	"url_end" TEXT,
	"npseries" INTEGER DEFAULT (1),
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- genre definition

CREATE TABLE "genre" (
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


-- rating definition

CREATE TABLE "rating" (
	"id_rating"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"src_img"	TEXT,
	"url"	TEXT,
	"title"	TEXT,
	"year"	INTEGER,
	"rating"	REAL,
	"is_present"	INTEGER DEFAULT (0),
	CONSTRAINT "rating_UN" UNIQUE("title","year")
);


-- report definition

CREATE TABLE "report" (
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


-- "user" definition

CREATE TABLE "user" (
	"id_user"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"name"	TEXT NOT NULL,
	"password"	TEXT NOT NULL,
	"ip"	TEXT,
	"agent"	TEXT,
	"email"	TEXT NOT NULL UNIQUE,
	"role"	TEXT DEFAULT 'user',
	"created_at"	TEXT NOT NULL,
	"last_login"	TEXT,
	CONSTRAINT "user_UN" UNIQUE("name","email")
);


-- deleted_movies definition

CREATE TABLE "deleted_movies" (
	"id_movie" INTEGER,
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
	FOREIGN KEY("id_subgenre") REFERENCES "genre"("id_genre"),
	FOREIGN KEY("id_genre") REFERENCES "genre"("id_genre"),
	FOREIGN KEY("id_country") REFERENCES "country"("id_country")
);


-- movies definition

CREATE TABLE movies (
	id_movie INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	realtitle TEXT,
	"year" INTEGER,
	quality TEXT,
	extension TEXT,
	"size" INTEGER,
	size_str TEXT,
	duration INTEGER,
	duration_str TEXT,
	pathfile TEXT,
	resolution TEXT,
	fps REAL,
	urldesc TEXT,
	ratings REAL DEFAULT (0.0),
	urlpicture TEXT,
	censure INTEGER DEFAULT (0),
	file_created TEXT,
	report_date TEXT,
	id_genre INTEGER NOT NULL,
	id_subgenre INTEGER DEFAULT (-1),
	id_country INTEGER,
	hdd_code INTEGER DEFAULT (99) NOT NULL,
	CONSTRAINT FK_movies_country FOREIGN KEY (id_country) REFERENCES country(id_country),
	CONSTRAINT FK_movies_genre_2 FOREIGN KEY (id_genre) REFERENCES genre(id_genre),
	CONSTRAINT FK_movies_genre_3 FOREIGN KEY (id_subgenre) REFERENCES genre(id_genre),
	CONSTRAINT movies_movies_FK FOREIGN KEY (id_movie) REFERENCES movies(id_movie) ON DELETE SET NULL ON UPDATE CASCADE,
	CONSTRAINT movies_movies_FK_1 FOREIGN KEY (id_movie) REFERENCES movies(id_movie) ON DELETE SET NULL ON UPDATE SET NULL
);
