import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
export class GenresView extends BaseView {
    constructor() {
        super();
        this.movieCards = [];
        this.currentGenreId = null;
        this.movieService = new MovieService();
    }
    async render(params) {
        this.currentGenreId = params?.id ? parseInt(params.id) : null;
        if (this.currentGenreId) {
            return this.renderGenreDetail(this.currentGenreId);
        }
        else {
            return this.renderGenreList();
        }
    }
    renderGenreList() {
        return `
            <div class="genres-container">
                <h1>Explorar por Géneros</h1>
                <div id="genres-grid" class="genres-grid"></div>
            </div>
        `;
    }
    renderGenreDetail(genreId) {
        return `
            <div class="genre-detail">
                <div class="genre-header">
                    <h1 id="genre-title">Cargando...</h1>
                    <div class="genre-stats" id="genre-stats"></div>
                </div>

                <div class="genre-filters">
                    <select id="sort-movies" class="form-select">
                        <option value="year_desc">Año (reciente primero)</option>
                        <option value="year_asc">Año (antiguo primero)</option>
                        <option value="title_asc">Título (A-Z)</option>
                        <option value="rating_desc">Rating (mejor primero)</option>
                        <option value="duration_desc">Duración (mayor primero)</option>
                    </select>

                    <input type="text"
                           id="filter-movies"
                           class="form-input"
                           placeholder="Filtrar por título...">
                </div>

                <div id="movies-container" class="movie-grid item-list"></div>

                <div id="pagination" class="pagination"></div>
            </div>
        `;
    }
    afterRender(params) {
        if (params?.id) {
            this.loadGenreDetail(parseInt(params.id));
        }
        else {
            this.loadGenres();
        }
    }
    async loadGenres() {
        try {
            const response = await this.movieService.getGenres();
            const genres = response;
            const container = document.getElementById('genres-grid');
            if (!container || !genres)
                return;
            container.innerHTML = genres.map(genre => `
            <a href="/menu/genres/${genre.id}" class="genre-card">
                <div class="genre-card-content">
                    <h3>${genre.name}</h3>
                </div>
            </a>
        `).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }
    async loadGenreDetail(genreId) {
        try {
            const movies = await this.movieService.getByGenre(genreId);
            console.log('movies:', movies, 'genreId:', genreId);
            const titleEl = document.getElementById('genre-title');
            if (titleEl)
                titleEl.textContent = `Género ${genreId}`;
            this.renderMovies(movies || []);
            this.setupFilters();
        }
        catch (error) {
            this.handleError(error, 'Error al cargar detalles del género');
        }
    }
    renderMovies(movies) {
        const container = document.getElementById('movies-container');
        if (!container)
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
                showAdmin: false
            });
            container.appendChild(card.getElement());
            this.movieCards.push(card);
        });
    }
    setupFilters() {
        const sortSelect = document.getElementById('sort-movies');
        const filterInput = document.getElementById('filter-movies');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                console.log('Sort changed:', e.target.value);
            });
        }
        if (filterInput) {
            filterInput.addEventListener('input', this.debounce(() => {
                console.log('Filter:', filterInput.value);
            }, 300));
        }
    }
    cleanup() {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}
export default GenresView;
