import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { MovieCard } from '../components/MovieCard.js';
import { auth } from '../main.js';
export class ViewView extends BaseView {
    constructor() {
        super();
        this.movieCards = [];
        this.currentYear = new Date().getFullYear();
        this.currentPage = 0;
        this.itemsPerPage = 50;
        this.searchQuery = '';
        this.movieService = new MovieService();
    }
    async render(params) {
        this.searchQuery = params?.search?.trim() || '';
        const year = !this.searchQuery && params?.id ? parseInt(params.id) : 0;
        this.currentPage = this.searchQuery ? 0 : (year === 0 ? 0 : year);
        const isSearch = this.searchQuery.length > 0;
        const headerTitle = isSearch
            ? 'Resultados de búsqueda'
            : (year === 0 ? 'Películas Recientes' : `Películas de ${year}`);
        const headerSubtitle = isSearch
            ? `Mostrando coincidencias para “${this.searchQuery}”`
            : '';
        return `
            <div class="view-container">
                <div class="view-header">
                    <h1>${headerTitle}</h1>
                    ${headerSubtitle ? `<p class="view-subtitle">${headerSubtitle}</p>` : ''}

                </div>

                <div id="movies-container" class="movie-grid item-list"></div>

                <div id="pagination" class="pagination"></div>


            </div>
        `;
    }
    async afterRender(params) {
        const searchQuery = params?.search?.trim() || '';
        const isSearch = searchQuery.length > 0;
        const year = !isSearch && params?.id ? parseInt(params.id) : 0;
        if (isSearch) {
            await this.loadSearchMovies(searchQuery);
        }
        else {
            await Promise.all([
                this.loadYearNavigation(year),
                this.loadMovies(year)
            ]);
        }
        this.setupEventListeners();
    }
    async loadMovies(year) {
        try {
            this.showLoader(true);
            let movies;
            if (year === 0) {
                movies = await this.movieService.getLatest(this.itemsPerPage);
            }
            else {
                const response = await this.movieService['connection'].get(`/movies_by_year/${year}/${this.itemsPerPage}`);
                movies = response.data;
            }
            if (!movies)
                return;
            this.renderMovies(movies);
            this.renderPagination(movies.length);
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas');
        }
        finally {
            this.showLoader(false);
        }
    }
    async loadSearchMovies(query) {
        try {
            this.showLoader(true);
            const movies = await this.movieService.search(query, this.itemsPerPage);
            if (!movies)
                return;
            this.renderMovies(movies);
            const pagination = document.getElementById('pagination');
            if (pagination) {
                pagination.innerHTML = '';
            }
        }
        catch (error) {
            this.handleError(error, 'Error al buscar películas');
        }
        finally {
            this.showLoader(false);
        }
    }
    renderMovies(movies) {
        const container = document.getElementById('movies-container');
        if (!container)
            return;
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
        const user = auth.getUser();
        const isAdmin = user?.role === 'admin';
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
    async loadYearNavigation(currentYear) {
        try {
            const response = await this.movieService['connection'].get('/years/available');
            const years = Array.isArray(response.data) ? response.data : [];
            const nav = document.getElementById('year-nav');
            if (!nav || !years)
                return;
            const normalizedYears = years
                .map((item) => ({
                year: Number(item?.year ?? item?.id ?? item),
                count: Number(item?.count ?? item?.total ?? item?.movies ?? 0)
            }))
                .filter(item => Number.isFinite(item.year))
                .sort((left, right) => right.year - left.year);
            nav.innerHTML = `
                <label class="year-nav-label" for="year-select">Año</label>
                <select id="year-select" class="year-select">
                    <option value="0" ${currentYear === 0 ? 'selected' : ''}>Recientes</option>
                    ${normalizedYears.map(({ year, count }) => `
                        <option value="${year}" ${year === currentYear ? 'selected' : ''}>
                            ${year}${count > 0 ? ` (${count})` : ''}
                        </option>
                    `).join('')}
                </select>
            `;
        }
        catch (error) {
            console.error('Error loading year navigation:', error);
        }
    }
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        if (!pagination)
            return;
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
            }
            else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }
        if (this.currentPage < totalPages - 1) {
            html += `<a href="#" data-page="${this.currentPage + 1}" class="next">Siguiente ›</a>`;
        }
        html += '</div>';
        pagination.innerHTML = html;
    }
    setupEventListeners() {
        document.getElementById('year-select')?.addEventListener('change', (e) => {
            const year = Number(e.target.value || 0);
            window.location.href = year === 0 ? '/view/0' : `/view/${year}`;
        });
        document.getElementById('items-per-page')?.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.reload();
        });
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.currentPage = page;
                this.reload();
            });
        });
        document.querySelector('.scroll-top')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.querySelector('.scroll-bottom')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }
    async handleEdit(movieId) {
        try {
            const movie = await this.movieService.getById(movieId);
            if (movie) {
                this.modalManager.openMovieEditor(movieId, movie);
            }
        }
        catch (error) {
            this.handleError(error, 'Error al cargar película para editar');
        }
    }
    async handleDelete(movieId) {
        const confirmed = await this.confirm('¿Estás seguro de eliminar esta película?');
        if (confirmed) {
            try {
                await this.movieService.delete(movieId);
                this.reload();
            }
            catch (error) {
                this.handleError(error, 'Error al eliminar película');
            }
        }
    }
    cleanup() {
        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];
    }
}
export default ViewView;
