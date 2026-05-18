import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { Genre, MovieCard as MovieCardType } from '../types/api.types.js';
import { auth } from '../main.js';

export class GenresView extends BaseView {
    private movieService: MovieService;
    private movieCards: MovieCard[] = [];
    private currentGenreId: number | null = null;
    private displayedMovies: MovieCardType[] = [];
    private currentSort: string = 'year_desc';
    private currentFilter: string = '';

    // Paginación
    private currentPage: number = 1;
    private totalPages: number = 0;
    private totalMovies: number = 0;
    private isLoadingMore: boolean = false;
    private paginationData: any = null;

    constructor() {
        super();
        this.movieService = new MovieService();
    }

    async render(params?: { id?: string }): Promise<string> {
        this.currentGenreId = params?.id ? parseInt(params.id) : null;

        if (this.currentGenreId) {
            return this.renderGenreDetail(this.currentGenreId);
        } else {
            return this.renderGenreList();
        }
    }

    private renderGenreList(): string {
        return `
            <div class="genres-container">
                <div class="head-result">
                    <h3>Explorar por Géneros</h3>
                </div>
                <div id="genres-grid" class="genres-grid"></div>
            </div>
        `;
    }

    private renderGenreDetail(genreId: number): string {
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

afterRender(params?: Record<string, string>): void {
    if (params?.id) {
        this.loadGenreDetail(parseInt(params.id));
    } else {
        this.loadGenres();
    }
}

 private async loadGenres(): Promise<void> {
    try {
        const genres = await this.movieService.getGenreInfo();
        const container = document.getElementById('genres-grid');

        if (!container || !genres) return;

        container.innerHTML = genres.map((genre: Genre) => {
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
    } catch (error) {
        this.handleError(error, 'Error al cargar géneros');
    }
}

private async loadGenreDetail(genreId: number): Promise<void> {
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
        if (titleEl) titleEl.textContent = genreName ? `Género ${genreName}` : `Género ${genreId}`;

        // Mostrar estadísticas
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
    } catch (error) {
        this.handleError(error, 'Error al cargar detalles del género');
    }
}

private setupInfiniteScroll(): void {
    const container = document.getElementById('movies-container');
    if (!container) return;

    // Usar Intersection Observer para detectar cuando llega al final
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.isLoadingMore && this.currentPage < this.totalPages) {
                this.loadMoreMovies();
            }
        });
    }, { threshold: 0.1 });

    // Observar el último elemento de la lista
    const lastCard = container.lastElementChild;
    if (lastCard) {
        observer.observe(lastCard);
    }
}

private async loadMoreMovies(): Promise<void> {
    if (this.isLoadingMore || !this.currentGenreId) return;

    this.isLoadingMore = true;

    try {
        const nextPage = this.currentPage + 1;
        const response = await this.movieService.getByGenre(this.currentGenreId, nextPage);
        const newMovies = response?.data || [];

        if (newMovies.length > 0) {
            this.displayedMovies = [...this.displayedMovies, ...newMovies];
            this.currentPage = nextPage;

            // Agregar nuevas películas al contenedor
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
                        genreId: (movie as any).id_genre_path,
                        showAdmin: isAdmin
                    });

                    container.appendChild(card.getElement());
                    this.movieCards.push(card);
                });

                // Observar el nuevo último elemento
                this.setupInfiniteScroll();
            }
        }
    } catch (error) {
        console.error('Error cargando más películas:', error);
    } finally {
        this.isLoadingMore = false;
    }
}

    private renderMovies(movies: MovieCardType[]): void {
        const container = document.getElementById('movies-container');
        if (!container) return;

        container.innerHTML = '';
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];

        if (movies.length === 0) {
            container.innerHTML = '<p class="empty-state">No se encontraron películas con esos filtros.</p>';
            return;
        }

        const isAdmin = auth.getUser()?.role === 'admin';

        // Crear nuevas cards
        movies.forEach(movie => {
            const card = new MovieCard({
                movieId: movie.id_movie,
                title: movie.title,
                year: movie.year,
                duration: 0,
                rating: movie.ratings,
                poster: movie.urlpicture,
                genreId: (movie as any).id_genre_path,
                showAdmin: isAdmin
            });

            container.appendChild(card.getElement());
            this.movieCards.push(card);
        });
    }

private setupFilters(): void {
    const sortSelect = document.getElementById('movie-sort') as HTMLSelectElement | null;
    const filterInput = document.getElementById('movie-filter-input') as HTMLInputElement | null;

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            this.currentSort = (e.target as HTMLSelectElement).value;
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

    private applyMovieFilters(): void {
        const filteredMovies = this.displayedMovies.filter(movie =>
            movie.title.toLowerCase().includes(this.currentFilter)
        );

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

    private getDurationValue(movie: MovieCardType): number {
        const duration = movie.duration_str || '';
        const match = duration.match(/(\d+)/g);

        if (!match) return 0;

        if (match.length >= 2) {
            const hours = parseInt(match[0], 10) || 0;
            const minutes = parseInt(match[1], 10) || 0;
            return (hours * 60) + minutes;
        }

        return parseInt(match[0], 10) || 0;
    }

    cleanup(): void {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
        this.displayedMovies = [];
        this.currentPage = 1;
        this.totalPages = 0;
        this.totalMovies = 0;
    }
}

export default GenresView;
