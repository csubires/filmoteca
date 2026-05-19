import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { auth } from '../main.js';
export class GenresView extends BaseView {
    constructor() {
        super();
        this.movieCards = [];
        this.currentGenreId = null;
        this.displayedMovies = [];
        this.currentSort = 'year_desc';
        this.currentFilter = '';
        this.currentPage = 1;
        this.totalPages = 0;
        this.totalMovies = 0;
        this.isLoadingMore = false;
        this.paginationData = null;
        this.movieService = new MovieService();
    }
    async render(params) {
        const rawId = params?.id;
        const parsedId = rawId !== undefined && rawId !== null ? Number(rawId) : NaN;
        this.currentGenreId = Number.isFinite(parsedId) ? parsedId : null;
        if (this.currentGenreId !== null) {
            return this.renderGenreDetail(this.currentGenreId);
        }
        else {
            return this.renderGenreList();
        }
    }
    renderGenreList() {
        return `
            <div class="genres-container">
                <div class="head-result">
                    <h3>Explorar por Géneros</h3>
                </div>
                <div id="genres-grid" class="genres-grid"></div>
            </div>
        `;
    }
    renderGenreDetail(genreId) {
        return `
            <div class="genre-detail">
                <div class="genre-header">
                    <h1 id="genre-title" class="genre-title">Cargando...</h1>
                    <div class="genre-stats" id="genre-stats"></div>
                </div>

                <div id="movie-filter" class="movie-filter control-panel">
                    <div class="menu">
                        <div class="container-bottom">
                            <select id="movie-sort" class="form-select">
                                <option value="year_desc">Año (reciente primero)</option>
                                <option value="year_asc">Año (antiguo primero)</option>
                                <option value="title_asc">Título (A-Z)</option>
                                <option value="title_desc">Título (Z-A)</option>
                                <option value="rating_desc">Rating (mejor primero)</option>
                                <option value="duration_desc">Duración (mayor primero)</option>
                            </select>

                            <input type="text"
                                   id="movie-filter-input"
                                   class="form-input"
                                   placeholder="Filtrar por título...">
                        </div>
                    </div>
                </div>

                <div id="movies-container" class="movie-grid item-list"></div>

                <div id="pagination" class="pagination"></div>
            </div>
        `;
    }
    afterRender(params) {
        if (this.currentGenreId !== null) {
            this.loadGenreDetail(this.currentGenreId);
        }
        else {
            this.loadGenres();
        }
    }
    async loadGenres() {
        try {
            const genres = await this.movieService.getGenreInfo();
            const container = document.getElementById('genres-grid');
            if (!container || !genres)
                return;
            container.innerHTML = genres.map((genre) => {
                const cardClass = genre.is_subgenre ? 'genre-card card-subgenre' : 'genre-card';
                return `
                <a href="/menu/genres/${genre.id_genre}" class="${cardClass}">
                    ${genre.is_subgenre ? '<div class="popup-genre">Subgénero</div>' : ''}
                    <img
                        src="/assets/genres/${genre.id_genre}.jpg"
                        loading="lazy"
                        alt="${genre.name}"
                        onerror="this.src='/assets/default_poster.jpg'">
                    <div class="genre-card-content">
                        <h3>${genre.name}</h3>
                        <div class="card-genre-right">
                            <span><b>${genre.num_movies}</b> Películas</span>
                            <span>Tamaño Global <b>${genre.local_size_str}</b></span>
                            <span><b>${genre.local_duration_str}</b></span>
                        </div>
                    </div>
                </a>
            `;
            }).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }
    async loadGenreDetail(genreId) {
        try {
            const [response, genres] = await Promise.all([
                this.movieService.getByGenre(genreId, 1),
                this.movieService.getGenreInfo()
            ]);
            const movies = response?.data || [];
            this.paginationData = response?.pagination || {};
            this.totalMovies = this.paginationData.total || 0;
            this.totalPages = this.paginationData.pages || 0;
            this.currentPage = 1;
            const genreName = (await this.movieService.getGenreName(genreId))
                || genres?.find((genre) => Number(genre.id_genre) === Number(genreId))?.name;
            const titleEl = document.getElementById('genre-title');
            if (titleEl)
                titleEl.textContent = genreName ? `Género ${genreName}` : `Género ${genreId}`;
            const genreInfo = genres?.find((genre) => Number(genre.id_genre) === Number(genreId));
            const statsEl = document.getElementById('genre-stats');
            if (statsEl && genreInfo) {
                statsEl.innerHTML = `
                <div class="stat">
                    <div class="stat-value">${this.totalMovies}</div>
                    <div class="stat-label">Películas</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${genreInfo.local_size_str || 'N/A'}</div>
                    <div class="stat-label">Tamaño Total</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${genreInfo.local_duration_str || 'N/A'}</div>
                    <div class="stat-label">Duración Total</div>
                </div>
            `;
            }
            this.displayedMovies = movies;
            this.renderMovies(this.displayedMovies);
            this.setupFilters();
            this.setupInfiniteScroll();
        }
        catch (error) {
            this.handleError(error, 'Error al cargar detalles del género');
        }
    }
    setupInfiniteScroll() {
        const container = document.getElementById('movies-container');
        if (!container)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoadingMore && this.currentPage < this.totalPages) {
                    this.loadMoreMovies();
                }
            });
        }, { threshold: 0.1 });
        const lastCard = container.lastElementChild;
        if (lastCard) {
            observer.observe(lastCard);
        }
    }
    async loadMoreMovies() {
        if (this.isLoadingMore || !this.currentGenreId)
            return;
        this.isLoadingMore = true;
        try {
            const nextPage = this.currentPage + 1;
            const response = await this.movieService.getByGenre(this.currentGenreId, nextPage);
            const newMovies = response?.data || [];
            if (newMovies.length > 0) {
                this.displayedMovies = [...this.displayedMovies, ...newMovies];
                this.currentPage = nextPage;
                const container = document.getElementById('movies-container');
                if (container) {
                    const isAdmin = auth.getUser()?.role === 'admin';
                    newMovies.forEach(movie => {
                        const card = new MovieCard({
                            movieId: movie.id_movie,
                            title: movie.title,
                            year: movie.year,
                            duration: 0,
                            rating: movie.ratings,
                            poster: movie.urlpicture,
                            genreId: movie.id_genre_path,
                            showAdmin: isAdmin
                        });
                        container.appendChild(card.getElement());
                        this.movieCards.push(card);
                    });
                    this.setupInfiniteScroll();
                }
            }
        }
        catch (error) {
            console.error('Error cargando más películas:', error);
        }
        finally {
            this.isLoadingMore = false;
        }
    }
    renderMovies(movies) {
        const container = document.getElementById('movies-container');
        if (!container)
            return;
        container.innerHTML = '';
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
        if (movies.length === 0) {
            container.innerHTML = '<p class="empty-state">No se encontraron películas con esos filtros.</p>';
            return;
        }
        const isAdmin = auth.getUser()?.role === 'admin';
        movies.forEach(movie => {
            const card = new MovieCard({
                movieId: movie.id_movie,
                title: movie.title,
                year: movie.year,
                duration: 0,
                rating: movie.ratings,
                poster: movie.urlpicture,
                genreId: movie.id_genre_path,
                showAdmin: isAdmin
            });
            container.appendChild(card.getElement());
            this.movieCards.push(card);
        });
    }
    setupFilters() {
        const sortSelect = document.getElementById('movie-sort');
        const filterInput = document.getElementById('movie-filter-input');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyMovieFilters();
            });
        }
        if (filterInput) {
            filterInput.addEventListener('input', this.debounce(() => {
                this.currentFilter = filterInput.value.trim().toLowerCase();
                this.applyMovieFilters();
            }, 300));
        }
    }
    applyMovieFilters() {
        const filteredMovies = this.displayedMovies.filter(movie => movie.title.toLowerCase().includes(this.currentFilter));
        const sortedMovies = [...filteredMovies].sort((left, right) => {
            switch (this.currentSort) {
                case 'year_asc':
                    return left.year - right.year;
                case 'title_asc':
                    return left.title.localeCompare(right.title, 'es', { sensitivity: 'base' });
                case 'title_desc':
                    return right.title.localeCompare(left.title, 'es', { sensitivity: 'base' });
                case 'rating_desc':
                    return (right.ratings || 0) - (left.ratings || 0);
                case 'duration_desc':
                    return this.getDurationValue(right) - this.getDurationValue(left);
                case 'year_desc':
                default:
                    return right.year - left.year;
            }
        });
        this.renderMovies(sortedMovies);
    }
    getDurationValue(movie) {
        const duration = movie.duration_str || '';
        const match = duration.match(/(\d+)/g);
        if (!match)
            return 0;
        if (match.length >= 2) {
            const hours = parseInt(match[0], 10) || 0;
            const minutes = parseInt(match[1], 10) || 0;
            return (hours * 60) + minutes;
        }
        return parseInt(match[0], 10) || 0;
    }
    cleanup() {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
        this.displayedMovies = [];
        this.currentPage = 1;
        this.totalPages = 0;
        this.totalMovies = 0;
    }
}
export default GenresView;
