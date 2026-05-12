-- Optimizations for SQLite 3.45.1
-- Run this script to optimize database performance
-- Compatible with Python 3.12+

-- Create indices for better query performance
-- These indices improve search and join operations

-- Indices for movies table (most frequently searched)
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_id_genre ON movies(id_genre);
CREATE INDEX IF NOT EXISTS idx_movies_id_subgenre ON movies(id_subgenre);
CREATE INDEX IF NOT EXISTS idx_movies_id_country ON movies(id_country);
CREATE INDEX IF NOT EXISTS idx_movies_pathfile ON movies(pathfile);
CREATE INDEX IF NOT EXISTS idx_movies_report_date ON movies(report_date);
CREATE INDEX IF NOT EXISTS idx_movies_ratings ON movies(ratings);
CREATE INDEX IF NOT EXISTS idx_movies_hdd_code ON movies(hdd_code);
CREATE INDEX IF NOT EXISTS idx_movies_extension ON movies(extension);
CREATE INDEX IF NOT EXISTS idx_movies_resolution ON movies(resolution);
CREATE INDEX IF NOT EXISTS idx_movies_quality ON movies(quality);

-- Composite indices for common query patterns
CREATE INDEX IF NOT EXISTS idx_movies_genre_report ON movies(id_genre, report_date);
CREATE INDEX IF NOT EXISTS idx_movies_country_rating ON movies(id_country, ratings);
CREATE INDEX IF NOT EXISTS idx_movies_hdd_report ON movies(hdd_code, report_date);
CREATE INDEX IF NOT EXISTS idx_movies_year_rating ON movies(year, ratings);

-- Indices for genre table
CREATE INDEX IF NOT EXISTS idx_genre_name ON genre(name);
CREATE INDEX IF NOT EXISTS idx_genre_pathfolder ON genre(pathfolder);
CREATE INDEX IF NOT EXISTS idx_genre_is_subgenre ON genre(is_subgenre);
CREATE INDEX IF NOT EXISTS idx_genre_report_date ON genre(report_date);
CREATE INDEX IF NOT EXISTS idx_genre_hash_folder ON genre(hash_folder);

-- Indices for country table
CREATE INDEX IF NOT EXISTS idx_country_name ON country(name);
CREATE INDEX IF NOT EXISTS idx_country_code ON country(code);

-- Indices for rating table
CREATE INDEX IF NOT EXISTS idx_rating_title_year ON rating(title, year);
CREATE INDEX IF NOT EXISTS idx_rating_rating_val ON rating(rating);
CREATE INDEX IF NOT EXISTS idx_rating_is_present ON rating(is_present);

-- Indices for report table
CREATE INDEX IF NOT EXISTS idx_report_date ON report(report_date);
CREATE INDEX IF NOT EXISTS idx_report_hdd_code ON report(hdd_code);

-- Indices for deleted_movies table
CREATE INDEX IF NOT EXISTS idx_deleted_movies_title ON deleted_movies(title);
CREATE INDEX IF NOT EXISTS idx_deleted_movies_pathfile ON deleted_movies(pathfile);
CREATE INDEX IF NOT EXISTS idx_deleted_movies_id_genre ON deleted_movies(id_genre);

-- Indices for user table
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_name ON user(name);

-- Indices for data table
CREATE INDEX IF NOT EXISTS idx_data_id_data ON data(id_data);
CREATE INDEX IF NOT EXISTS idx_data_date_end ON data(date_end);

-- Pragma optimizations for SQLite 3.45.1
-- Enable these pragmas in your connection handler

-- PRAGMA optimize;  -- Analyzes indices to optimize query planner
-- PRAGMA integrity_check;  -- Verify database integrity
-- PRAGMA quick_check;  -- Quick integrity check
-- PRAGMA analysis_limit=1000;  -- Limit analysis depth
-- PRAGMA cache_size=-64000;  -- 64MB cache
-- PRAGMA page_size=4096;  -- Standard page size
-- PRAGMA synchronous=NORMAL;  -- Balance between safety and speed
-- PRAGMA temp_store=MEMORY;  -- Store temp tables in memory
