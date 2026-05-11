import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { ModalManager } from '../components/ModalManager.js';
import { Movie, MovieCard as MovieCardType } from '../types/api.types.js';
import { auth } from '../main.js';

export class ViewView extends BaseView {
    private movieService: MovieService;
    private movieCards: MovieCard[] = [];
    private currentYear: number = new Date().getFullYear();
    private currentPage: number = 0;
    private itemsPerPage: number = 50;

    constructor() {
        super();
        this.movieService = new MovieService();
    }

    async render(params?: { id?: string }): Promise<string> {
        const year = params?.id ? parseInt(params.id) : 0;
        this.currentPage = year === 0 ? 0 : year;

        return `
            <div class="view-container">
                <div class="view-header">
                    <h1>${year === 0 ? 'Películas Recientes' : `Películas de ${year}`}</h1>

                    <div class="view-controls">
                        <div class="year-nav" id="year-nav"></div>

                        <div class="view-options">
                            <select id="items-per-page">
                                <option value="25">25 por página</option>
                                <option value="50" selected>50 por página</option>
                                <option value="100">100 por página</option>
                                <option value="200">200 por página</option>
                            </select>

                            <button id="toggle-view" class="btn btn-primary-outline">
                                <span>🔲</span> Cambiar vista
                            </button>
                        </div>
                    </div>
                </div>

                <div id="movies-container" class="movie-grid item-list"></div>

                <div id="pagination" class="pagination"></div>

                <div id="control" class="control-panel">
                    🗓
                    <div class="menu">
                        <div class="container-bottom">
                            <a href="#" class="scroll-top">⬆️</a>
                            <a href="#" class="scroll-bottom">⬇️</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender(params?: { id?: string }): Promise<void> {
        const year = params?.id ? parseInt(params.id) : 0;

        await Promise.all([
            this.loadYearNavigation(year),
            this.loadMovies(year)
        ]);

        this.setupEventListeners();
    }

    private async loadMovies(year: number): Promise<void> {
        try {
            this.showLoader(true);

            let movies: MovieCardType[] | null;

            if (year === 0) {
                movies = await this.movieService.getLatest(this.itemsPerPage);
            } else {
                // Obtener películas por año (necesitarías implementar este método)
                const response = await this.movieService['connection'].get(
                    `/movies_by_year/${year}/${this.itemsPerPage}`
                );
                movies = response.data;
            }

            if (!movies) return;

            this.renderMovies(movies);
            this.renderPagination(movies.length);
        } catch (error) {
            this.handleError(error, 'Error al cargar películas');
        } finally {
            this.showLoader(false);
        }
    }

    private renderMovies(movies: MovieCardType[]): void {
        const container = document.getElementById('movies-container');
        if (!container) return;

        // Limpiar cards anteriores
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];

        const user = auth.getUser();
        const isAdmin = user?.role === 'admin';

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

    private async loadYearNavigation(currentYear: number): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/years/available');
            const years = response.data;
            const nav = document.getElementById('year-nav');

            if (!nav || !years) return;

            nav.innerHTML = `
                <a href="/view/0" class="${currentYear === 0 ? 'active' : ''}">
                    Recientes
                </a>
                ${years.map((year: number) => `
                    <a href="/view/${year}" class="${year === currentYear ? 'active' : ''}">
                        ${year}
                    </a>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error loading year navigation:', error);
        }
    }

    private renderPagination(totalItems: number): void {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');

        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';

        if (this.currentPage > 0) {
            html += `<a href="#" data-page="${this.currentPage - 1}" class="prev">‹ Anterior</a>`;
        }

        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || Math.abs(i - this.currentPage) <= 2) {
                html += `<a href="#" data-page="${i}" class="${i === this.currentPage ? 'active' : ''}">${i + 1}</a>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        if (this.currentPage < totalPages - 1) {
            html += `<a href="#" data-page="${this.currentPage + 1}" class="next">Siguiente ›</a>`;
        }

        html += '</div>';
        pagination.innerHTML = html;
    }

    protected setupEventListeners(): void {
        // Items por página
        document.getElementById('items-per-page')?.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt((e.target as HTMLSelectElement).value);
            this.reload();
        });

        // Paginación
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt((e.target as HTMLElement).dataset.page!);
                this.currentPage = page;
                this.reload();
            });
        });

        // Scroll buttons
        document.querySelector('.scroll-top')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.querySelector('.scroll-bottom')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }

    private async handleEdit(movieId: number): Promise<void> {
        try {
            const movie = await this.movieService.getById(movieId);
            if (movie) {
                const csrfToken = this.getCsrfToken() || '';
                this.modalManager.openMovieEditor(movieId, movie, csrfToken);
            }
        } catch (error) {
            this.handleError(error, 'Error al cargar película para editar');
        }
    }

    private async handleDelete(movieId: number): Promise<void> {
        const confirmed = await this.confirm('¿Estás seguro de eliminar esta película?');

        if (confirmed) {
            try {
                await this.movieService.delete(movieId);
                this.reload();
            } catch (error) {
                this.handleError(error, 'Error al eliminar película');
            }
        }
    }

    cleanup(): void {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}

export default ViewView;
