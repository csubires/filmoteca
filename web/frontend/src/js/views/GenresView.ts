import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { Genre, MovieCard as MovieCardType } from '../types/api.types.js';
import { formatBytes, formatDuration } from '../utils.js';

export class GenresView extends BaseView {
    private movieService: MovieService;
    private movieCards: MovieCard[] = [];
    private currentGenreId: number | null = null;

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
                <h1>Explorar por Géneros</h1>
                <div id="genres-grid" class="genres-grid"></div>
            </div>
        `;
    }

    private renderGenreDetail(genreId: number): string {
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

afterRender(params?: Record<string, string>): void {
    if (params?.id) {
        this.loadGenreDetail(parseInt(params.id));
    } else {
        this.loadGenres();
    }
}

 private async loadGenres(): Promise<void> {
    try {
        const response = await this.movieService.getGenres();
        const genres = response;
        const container = document.getElementById('genres-grid');

        if (!container || !genres) return;

container.innerHTML = genres.map(genre => `
            <a href="/menu/genres/${genre.id}" class="genre-card">
                <div class="genre-card-content">
                    <h3>${genre.name}</h3>
                </div>
            </a>
        `).join('');
    } catch (error) {
        this.handleError(error, 'Error al cargar géneros');
    }
}

private async loadGenreDetail(genreId: number): Promise<void> {
    try {
const movies = await this.movieService.getByGenre(genreId);
console.log('movies:', movies, 'genreId:', genreId);

        const titleEl = document.getElementById('genre-title');
        if (titleEl) titleEl.textContent = `Género ${genreId}`;

        this.renderMovies(movies || []);
        this.setupFilters();
    } catch (error) {
        this.handleError(error, 'Error al cargar detalles del género');
    }
}

    private renderMovies(movies: MovieCardType[]): void {
        const container = document.getElementById('movies-container');
        if (!container) return;

        // Limpiar cards anteriores
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];

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
                showAdmin: false
            });

            container.appendChild(card.getElement());
            this.movieCards.push(card);
        });
    }

private setupFilters(): void {
    const sortSelect = document.getElementById('sort-movies');
    const filterInput = document.getElementById('filter-movies') as HTMLInputElement;

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            console.log('Sort changed:', (e.target as HTMLSelectElement).value);
        });
    }

    if (filterInput) {
        filterInput.addEventListener('input', this.debounce(() => {
            console.log('Filter:', filterInput.value);
        }, 300));
    }
}

    cleanup(): void {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}

export default GenresView;
