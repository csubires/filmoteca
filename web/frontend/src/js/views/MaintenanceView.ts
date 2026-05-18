import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { ModalManager } from '../components/ModalManager.js';
import { flagEmoji } from '../utils.js';

interface MaintenanceOption {
    key: string;
    name: string;
    description: string;
}

export class MaintenanceView extends BaseView {
    private movieService: MovieService;
    private currentMenu: string = 'general';

    constructor() {
        super();
        this.movieService = new MovieService();
    }

    async render(params?: { menu?: string }): Promise<string> {
        this.currentMenu = params?.menu || (params as any)?.section || 'general';

        const options: MaintenanceOption[] = [
            { key: 'repeated', name: 'Duplicados', description: 'Películas potencialmente duplicadas' },
            { key: 'uncoded-countries', name: 'Países', description: 'Películas de países sin código' },
            { key: 'incomplete-genres', name: 'Géneros', description: 'Películas con géneros incompletos' },
            { key: 'incomplete', name: 'Incompletas', description: 'Películas sin información completa' },
            { key: 'censored', name: 'Censuradas', description: 'Películas marcadas como censuradas' },
            { key: 'bad-movies', name: 'Deficientes', description: 'Películas de baja calidad' }
        ];

        return `
            <div class="maintenance-container">
                <h1>Mantenimiento</h1>

                <section class="inventories-panel maintenance-panel">
                    <div class="head-result-little">
                        <h3>Opciones de mantenimiento</h3>
                    </div>
                    <div id="maintenance-options" class="inventories-grid maintenance-grid">
                        ${options.map(opt => `
                            <a class="inventory-card maintenance-option ${this.currentMenu === opt.key ? 'active' : ''}"
                               data-descr="${opt.description}"
                               href="/maintenance/${opt.key}">
                                <strong>${opt.name}</strong>
                                <small>${opt.description}</small>
                            </a>
                        `).join('')}
                    </div>
                </section>

                <div id="maintenance-content" class="maintenance-content">
                    ${this.renderCurrentMenu()}
                </div>
            </div>
        `;
    }

    private renderCurrentMenu(): string {
        switch (this.currentMenu) {
            case 'repeated':
                return this.renderRepeatedMenu();
            case 'uncoded-countries':
                return this.renderCountriesMenu();
            case 'incomplete-genres':
                return this.renderGenresMenu();
            case 'incomplete':
                return this.renderIncompleteMenu();
            case 'censored':
                return this.renderCensoredMenu();
            case 'bad-movies':
                return this.renderBadMoviesMenu();
            default:
                return '<p>Selecciona una opción de mantenimiento</p>';
        }
    }

    private renderRepeatedMenu(): string {
        return `
            <div class="head-result">
                <h3>Películas duplicadas <span id="duplicates-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas potencialmente duplicadas</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID 1</th>
                                <th>Película 1</th>
                                <th>ID 2</th>
                                <th>Película 2</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="duplicates-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderCountriesMenu(): string {
        return `
            <div class="head-result">
                <h3>Películas de países sin código <span id="countries-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas de países sin código de identificación</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Película</th>
                                <th>País</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="countries-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderGenresMenu(): string {
        return `
            <div class="head-result">
                <h3>Géneros incompletos <span id="genres-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con géneros incompletos</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>Género ID</th>
                                <th>Género</th>
                                <th>Películas</th>
                            </tr>
                        </thead>
                        <tbody id="genres-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderIncompleteMenu(): string {
        return `
            <div class="head-result">
                <h3>Películas incompletas <span id="incomplete-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas sin información completa</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody id="incomplete-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderCensoredMenu(): string {
        return `
            <div class="head-result">
                <h3>Películas censuradas <span id="censored-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas marcadas como censuradas</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="censored-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderBadMoviesMenu(): string {
        return `
            <div class="head-result">
                <h3>Películas deficientes <span id="bad-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas de baja calidad o deficientes</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody id="bad-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    async afterRender(params?: { menu?: string }): Promise<void> {
        this.currentMenu = params?.menu || (params as any)?.section || 'general';

        switch (this.currentMenu) {
            case 'repeated':
                await this.loadRepeated();
                break;
            case 'uncoded-countries':
                await this.loadCountries();
                break;
            case 'incomplete-genres':
                await this.loadGenres();
                break;
            case 'incomplete':
                await this.loadIncomplete();
                break;
            case 'censored':
                await this.loadCensored();
                break;
            case 'bad-movies':
                await this.loadBadMovies();
                break;
        }
    }

    private async loadRepeated(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/repeated');
            const movies = response.data || [];

            const tbody = document.getElementById('duplicates-table-body');
            const countSpan = document.getElementById('duplicates-count');

            if (!tbody || !movies) return;

            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }

            tbody.innerHTML = movies.map((movie: any) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.id_movie2}</td>
                    <td>${movie.title2}</td>
                    <td>${movie.year}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar duplicados');
        }
    }

    private async loadCountries(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/uncoded-countries');
            const movies = response.data || [];

            const tbody = document.getElementById('countries-table-body');
            const countSpan = document.getElementById('countries-count');

            if (!tbody || !movies) return;

            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }

            tbody.innerHTML = movies.map((movie: any) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.name || 'N/A'}</td>
                    <td>${movie.year}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar películas de países');
        }
    }

    private async loadGenres(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/incomplete-genres');
            const genres = response.data || [];

            const tbody = document.getElementById('genres-table-body');
            const countSpan = document.getElementById('genres-count');

            if (!tbody || !genres) return;

            if (countSpan) {
                countSpan.textContent = genres.length.toString();
            }

            tbody.innerHTML = genres.map((genre: any) => `
                <tr>
                    <td>${genre.id_genre}</td>
                    <td>${genre.name}</td>
                    <td>${genre.count || 0}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }

    private async loadIncomplete(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/incomplete');
            const movies = response.data || [];

            const tbody = document.getElementById('incomplete-table-body');
            const countSpan = document.getElementById('incomplete-count');

            if (!tbody || !movies) return;

            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }

            tbody.innerHTML = movies.map((movie: any) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.year}</td>
                    <td>${movie.rating || 'N/A'}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar películas incompletas');
        }
    }

    private async loadCensored(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/censored');
            const movies = response.data || [];

            const tbody = document.getElementById('censored-table-body');
            const countSpan = document.getElementById('censored-count');

            if (!tbody || !movies) return;

            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }

            tbody.innerHTML = movies.map((movie: any) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.year}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar películas censuradas');
        }
    }

    private async loadBadMovies(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/bad-movies');
            const movies = response.data || [];

            const tbody = document.getElementById('bad-table-body');
            const countSpan = document.getElementById('bad-count');

            if (!tbody || !movies) return;

            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }

            tbody.innerHTML = movies.map((movie: any) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.year}</td>
                    <td>${movie.rating || 'N/A'}</td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar películas deficientes');
        }
    }

    cleanup(): void {
        // Limpiar eventos si es necesario
    }
}

export default MaintenanceView;
