import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { formatBytes, formatDuration } from '../utils.js';
export class HomeView extends BaseView {
    constructor() {
        super();
        this.movieCards = [];
        this.movieService = new MovieService();
    }
    async render() {
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
                    <div class="carousel-container">
                        <button class="carousel-btn carousel-btn-prev" data-carousel="recent-movies-carousel" aria-label="Anterior">❮</button>
                        <div id="recent-movies" class="movie-carousel-wrapper">
                            <div class="movie-carousel"></div>
                        </div>
                        <button class="carousel-btn carousel-btn-next" data-carousel="recent-movies-carousel" aria-label="Siguiente">❯</button>
                    </div>
                </div>

                <div class="featured-genres">
                    <h2>Explorar por género</h2>
                    <div id="genre-cloud" class="genre-cloud"></div>
                </div>
            </div>
        `;
    }
    async afterRender() {
        await Promise.all([
            this.loadStats(),
            this.loadRecentMovies(),
            this.loadGenreCloud()
        ]);
    }
    async loadStats() {
        try {
            const response = await this.movieService['connection'].get('/stats/summary');
            const stats = response.data;
            if (stats) {
                document.getElementById('total-movies').textContent = String(stats.total_movies ?? 0);
                document.getElementById('total-size').textContent = formatBytes(Number(stats.total_size || 0));
                document.getElementById('total-duration').textContent = formatDuration(Number(stats.total_duration || 0));
                document.getElementById('total-genres').textContent = stats.total_genres;
            }
        }
        catch (error) {
            this.handleError(error, 'Error al cargar estadísticas');
        }
    }
    async loadRecentMovies() {
        try {
            const movies = await this.movieService.getLatest(12);
            const container = document.querySelector('.movie-carousel');
            if (!container || !movies)
                return;
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
                    genreId: movie.id_genre_path,
                    genreName: movie.genre_name,
                    showAdmin: false
                });
                container.appendChild(card.getElement());
                this.movieCards.push(card);
            });
            this.setupCarouselNavigation();
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas recientes');
        }
    }
    async loadGenreCloud() {
        try {
            const response = await this.movieService['connection'].get('/genres/cloud');
            const genres = response.data;
            const container = document.getElementById('genre-cloud');
            if (!container || !genres)
                return;
            container.innerHTML = genres
                .map((genre) => `
                    <a href="/menu/genres/${genre.id}"
                       class="genre-tag"
                       style="font-size: ${Math.max(0.8, Math.min(2.5, genre.count / 10))}rem">
                        ${genre.name} (${genre.count})
                    </a>
                `)
                .join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }
    setupCarouselNavigation() {
        const wrapper = document.querySelector('.movie-carousel-wrapper');
        const prevBtn = document.querySelector('[data-carousel="recent-movies-carousel"].carousel-btn-prev');
        const nextBtn = document.querySelector('[data-carousel="recent-movies-carousel"].carousel-btn-next');
        if (!wrapper || !prevBtn || !nextBtn)
            return;
        prevBtn.addEventListener('click', () => {
            wrapper.scrollBy({
                left: -320,
                behavior: 'smooth'
            });
        });
        nextBtn.addEventListener('click', () => {
            wrapper.scrollBy({
                left: 320,
                behavior: 'smooth'
            });
        });
        const updateButtonVisibility = () => {
            prevBtn.style.opacity = wrapper.scrollLeft <= 0 ? '0.3' : '1';
            prevBtn.style.pointerEvents = wrapper.scrollLeft <= 0 ? 'none' : 'auto';
            const scrollableWidth = wrapper.scrollWidth - wrapper.clientWidth;
            nextBtn.style.opacity = wrapper.scrollLeft >= scrollableWidth - 10 ? '0.3' : '1';
            nextBtn.style.pointerEvents = wrapper.scrollLeft >= scrollableWidth - 10 ? 'none' : 'auto';
        };
        wrapper.addEventListener('scroll', updateButtonVisibility);
        updateButtonVisibility();
    }
    cleanup() {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}
export default HomeView;
