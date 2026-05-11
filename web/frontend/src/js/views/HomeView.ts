import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { MovieCard as MovieCardType } from '../types/api.types.js';

export class HomeView extends BaseView {
    private movieService: MovieService;
    private movieCards: MovieCard[] = [];

    constructor() {
        super();
        this.movieService = new MovieService();
    }

    async render(): Promise<string> {
        return `
            <div class="home-container">
                <div class="welcome-section">
                    <h1>Bienvenido al Gestor de Películas</h1>
                    <p>Explora tu colección de películas organizada por géneros, años y calificaciones</p>
                </div>

                <div class="quick-stats">
                    <div class="stat-card">
                        <span class="stat-icon">🎬</span>
                        <span class="stat-value" id="total-movies">-</span>
                        <span class="stat-label">Películas</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">📀</span>
                        <span class="stat-value" id="total-size">-</span>
                        <span class="stat-label">Tamaño total</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-value" id="total-duration">-</span>
                        <span class="stat-label">Duración total</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">🎭</span>
                        <span class="stat-value" id="total-genres">-</span>
                        <span class="stat-label">Géneros</span>
                    </div>
                </div>

                <div class="recent-section">
                    <h2>Últimas películas añadidas</h2>
                    <div id="recent-movies" class="movie-grid"></div>
                </div>

                <div class="featured-genres">
                    <h2>Explorar por género</h2>
                    <div id="genre-cloud" class="genre-cloud"></div>
                </div>
            </div>
        `;
    }

    async afterRender(): Promise<void> {
        await Promise.all([
            this.loadStats(),
            this.loadRecentMovies(),
            this.loadGenreCloud()
        ]);
    }

    private async loadStats(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/stats/summary');
            const stats = response.data;

            if (stats) {
                document.getElementById('total-movies')!.textContent = stats.total_movies;
                document.getElementById('total-size')!.textContent = stats.total_size;
                document.getElementById('total-duration')!.textContent = stats.total_duration;
                document.getElementById('total-genres')!.textContent = stats.total_genres;
            }
        } catch (error) {
            this.handleError(error, 'Error al cargar estadísticas');
        }
    }

    private async loadRecentMovies(): Promise<void> {
        try {
            const movies = await this.movieService.getLatest(12);
            const container = document.getElementById('recent-movies');

            if (!container || !movies) return;

            this.movieCards.forEach(card => card.getElement().remove());
            this.movieCards = [];

            movies.forEach(movie => {
                const card = new MovieCard({
                    movieId: movie.id_movie,
                    title: movie.title,
                    year: movie.year,
                    duration: 0,
                    rating: movie.ratings,
                    poster: movie.urlpicture,
                    genreId: movie.id_genre,
                    genreName: movie.genre_name,
                    showAdmin: false
                });

                container.appendChild(card.getElement());
                this.movieCards.push(card);
            });
        } catch (error) {
            this.handleError(error, 'Error al cargar películas recientes');
        }
    }

    private async loadGenreCloud(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/genres/cloud');
            const genres = response.data;
            const container = document.getElementById('genre-cloud');

            if (!container || !genres) return;

            container.innerHTML = genres
                .map((genre: any) => `
                    <a href="/menu/genres/${genre.id}"
                       class="genre-tag"
                       style="font-size: ${Math.max(0.8, Math.min(2.5, genre.count / 10))}rem">
                        ${genre.name} (${genre.count})
                    </a>
                `)
                .join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }

    cleanup(): void {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}

export default HomeView;
