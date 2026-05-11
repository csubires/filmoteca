class FilmService {
    constructor(db) {
        this.db = db;
    }

    async updateFilm(movieData) {
        try {
            const [movie] = movieData;
            if (!movie) return null;

            const updatedMovie = {
                ...movie,
                updated_at: new Date().toISOString()
            };

            const result = await this.db.execute('update_movie', updatedMovie);

            return result.changes > 0 ? [updatedMovie] : null;
        } catch (error) {
            console.error('Error updating film:', error);
            return null;
        }
    }
}

module.exports = FilmService;
