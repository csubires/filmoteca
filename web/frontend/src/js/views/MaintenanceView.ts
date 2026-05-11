import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { ModalManager } from '../components/ModalManager.js';
import { flagEmoji } from '../utils.js';

interface MaintenanceOption {
    key: string;
    name: string;
    description: string;
}

interface Country {
    id: number;
    name: string;
    code: string;
    flag?: string;
}

interface Genre {
    id: number;
    name: string;
    path: string;
    is_subgenre: number;
}

export class MaintenanceView extends BaseView {
    private movieService: MovieService;
    private currentMenu: string = 'general';

    constructor() {
        super();
        this.movieService = new MovieService();
    }

    async render(params?: { menu?: string }): Promise<string> {
        this.currentMenu = params?.menu || 'general';

        const options: MaintenanceOption[] = [
            { key: 'countries', name: 'Países', description: 'Gestionar códigos de países' },
            { key: 'genres', name: 'Géneros', description: 'Verificar géneros incompletos' },
            { key: 'duplicates', name: 'Duplicados', description: 'Buscar películas duplicadas' },
            { key: 'missing', name: 'Faltantes', description: 'Películas sin información' },
            { key: 'cleanup', name: 'Limpieza', description: 'Limpiar archivos temporales' },
            { key: 'backup', name: 'Backup', description: 'Crear copia de seguridad' }
        ];

        return `
            <div class="maintenance-container">
                <h1>Mantenimiento</h1>

                <div class="menu--clickeable btn btn-primary">
                    <input class="menu-btn" type="checkbox" id="menu-btn" />
                    <label class="menu-icon" for="menu-btn">
                        <span>Opciones de mantenimiento</span>
                        <span class="navicon"></span>
                    </label>
                    <div id="maintenance-options" class="maintenance-grid">
                        ${options.map(opt => `
                            <a class="btn btn-primary-outline maintenance-option ${this.currentMenu === opt.key ? 'active' : ''}"
                               data-descr="${opt.description}"
                               href="/maintenance/${opt.key}">
                                <strong>${opt.name}</strong>
                                <small>${opt.description}</small>
                            </a>
                        `).join('')}
                    </div>
                </div>

                <div id="maintenance-content" class="maintenance-content">
                    ${this.renderCurrentMenu()}
                </div>
            </div>
        `;
    }

    private renderCurrentMenu(): string {
        switch (this.currentMenu) {
            case 'countries':
                return this.renderCountriesMenu();
            case 'genres':
                return this.renderGenresMenu();
            case 'duplicates':
                return this.renderDuplicatesMenu();
            case 'missing':
                return this.renderMissingMenu();
            case 'cleanup':
                return this.renderCleanupMenu();
            case 'backup':
                return this.renderBackupMenu();
            default:
                return '<p>Selecciona una opción de mantenimiento</p>';
        }
    }

    private renderCountriesMenu(): string {
        return `
            <div class="head-result">
                <h3>Países <span id="countries-count">0</span></h3>
                <a class="btn btn-primary-outline" target="_blank"
                   href="https://country-code.cl/es/">
                    Listado de códigos
                </a>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Gestionar códigos de países</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Bandera</th>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Acciones</th>
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
                    <h1>Verificar géneros</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Ruta</th>
                                <th>Sub-Género</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody id="genres-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }

    private renderDuplicatesMenu(): string {
        return `
            <div class="duplicates-container">
                <h3>Buscar películas duplicadas</h3>
                <button id="scan-duplicates" class="btn btn-primary">
                    Escanear duplicados
                </button>
                <div id="duplicates-results" class="results-container"></div>
            </div>
        `;
    }

    private renderMissingMenu(): string {
        return `
            <div class="missing-container">
                <h3>Películas con información incompleta</h3>
                <div class="missing-filters">
                    <label>
                        <input type="checkbox" id="missing-rating" checked> Sin rating
                    </label>
                    <label>
                        <input type="checkbox" id="missing-poster" checked> Sin póster
                    </label>
                    <label>
                        <input type="checkbox" id="missing-description" checked> Sin descripción
                    </label>
                </div>
                <button id="scan-missing" class="btn btn-primary">
                    Buscar
                </button>
                <div id="missing-results" class="results-container"></div>
            </div>
        `;
    }

    private renderCleanupMenu(): string {
        return `
            <div class="cleanup-container">
                <h3>Limpiar archivos temporales</h3>
                <div class="cleanup-options">
                    <label>
                        <input type="checkbox" id="clean-cache"> Cache de imágenes
                    </label>
                    <label>
                        <input type="checkbox" id="clean-logs"> Logs antiguos
                    </label>
                    <label>
                        <input type="checkbox" id="clean-temp"> Archivos temporales
                    </label>
                </div>
                <button id="run-cleanup" class="btn btn-danger">
                    Ejecutar limpieza
                </button>
                <div id="cleanup-results" class="results-container"></div>
            </div>
        `;
    }

    private renderBackupMenu(): string {
        return `
            <div class="backup-container">
                <h3>Copia de seguridad</h3>
                <div class="backup-info">
                    <p>Crear una copia de seguridad de la base de datos y archivos de configuración.</p>
                    <p><strong>Último backup:</strong> <span id="last-backup">Nunca</span></p>
                </div>
                <button id="create-backup" class="btn btn-success">
                    Crear backup ahora
                </button>
                <div id="backup-results" class="results-container"></div>
            </div>
        `;
    }

    async afterRender(params?: { menu?: string }): Promise<void> {
        this.currentMenu = params?.menu || 'general';

        switch (this.currentMenu) {
            case 'countries':
                await this.loadCountries();
                break;
            case 'genres':
                await this.loadGenres();
                break;
            case 'duplicates':
                this.setupDuplicatesEvents();
                break;
            case 'missing':
                this.setupMissingEvents();
                break;
            case 'cleanup':
                this.setupCleanupEvents();
                break;
            case 'backup':
                await this.loadBackupInfo();
                this.setupBackupEvents();
                break;
        }
    }

    private async loadCountries(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/countries');
            const countries: Country[] = response.data;

            const tbody = document.getElementById('countries-table-body');
            const countSpan = document.getElementById('countries-count');

            if (!tbody || !countries) return;

            if (countSpan) {
                countSpan.textContent = countries.length.toString();
            }

            const csrfToken = this.getCsrfToken();

            tbody.innerHTML = countries.map(country => `
                <tr>
                    <td>${country.id}</td>
                    <td>${flagEmoji(country.code || '')}</td>
                    <td>${country.name}</td>
                    <td>
                        <input type="text"
                               id="input-country-${country.id}"
                               value="${country.code || ''}"
                               maxlength="3"
                               placeholder="Código">
                    </td>
                    <td>
                        <button class="btn btn-primary save-country"
                                data-id="${country.id}"
                                data-csrf="${csrfToken}">
                            GUARDAR
                        </button>
                    </td>
                </tr>
            `).join('');

            // Eventos para guardar países
            document.querySelectorAll('.save-country').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.target as HTMLElement;
                    const id = target.dataset.id;
                    const csrfToken = target.dataset.csrf;
                    const input = document.getElementById(`input-country-${id}`) as HTMLInputElement;

                    if (!id || !input || !csrfToken) return;

                    try {
                        await this.movieService['connection'].post('/maintenance/update-country', {
                            id: parseInt(id),
                            code: input.value.toUpperCase(),
                            csrf_token_form: csrfToken
                        });

                        this.alertManager.success('Código actualizado');

                        // Actualizar bandera
                        const flagCell = target.closest('tr')?.querySelector('td:nth-child(2)');
                        if (flagCell) {
                            flagCell.innerHTML = flagEmoji(input.value.toUpperCase());
                        }
                    } catch (error) {
                        this.handleError(error, 'Error al actualizar código');
                    }
                });
            });
        } catch (error) {
            this.handleError(error, 'Error al cargar países');
        }
    }

    private async loadGenres(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/genres');
            const genres: Genre[] = response.data;

            const tbody = document.getElementById('genres-table-body');
            const countSpan = document.getElementById('genres-count');

            if (!tbody || !genres) return;

            if (countSpan) {
                countSpan.textContent = genres.length.toString();
            }

            tbody.innerHTML = genres.map(genre => `
                <tr>
                    <td>${genre.id}</td>
                    <td>${genre.name}</td>
                    <td>${genre.path || '❌ Sin ruta'}</td>
                    <td>${genre.is_subgenre ? '✅ Sí' : '❌ No'}</td>
                    <td>
                        ${!genre.path ?
                            '<span class="badge warning">Falta ruta</span>' :
                            '<span class="badge success">OK</span>'
                        }
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }

    private setupDuplicatesEvents(): void {
        document.getElementById('scan-duplicates')?.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('duplicates-results');
            if (!resultsDiv) return;

            try {
                this.showLoader(true);
                resultsDiv.innerHTML = '<p class="loading">Escaneando...</p>';

                const response = await this.movieService['connection'].get('/maintenance/duplicates');
                const duplicates = response.data;

                if (duplicates.length === 0) {
                    resultsDiv.innerHTML = '<p class="success">No se encontraron duplicados</p>';
                    return;
                }

                resultsDiv.innerHTML = `
                    <h4>Se encontraron ${duplicates.length} posibles duplicados</h4>
                    <div class="duplicates-list">
                        ${duplicates.map((dup: any) => `
                            <div class="duplicate-item">
                                <div class="movie1">
                                    <strong>${dup.movie1.title}</strong> (${dup.movie1.year})
                                    <br><small>ID: ${dup.movie1.id}</small>
                                </div>
                                <div class="vs">VS</div>
                                <div class="movie2">
                                    <strong>${dup.movie2.title}</strong> (${dup.movie2.year})
                                    <br><small>ID: ${dup.movie2.id}</small>
                                </div>
                                <div class="actions">
                                    <button class="btn btn-danger-outline merge-duplicate"
                                            data-id1="${dup.movie1.id}"
                                            data-id2="${dup.movie2.id}">
                                        Fusionar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Eventos para fusionar
                document.querySelectorAll('.merge-duplicate').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.target as HTMLElement;
                        const id1 = target.dataset.id1;
                        const id2 = target.dataset.id2;

                        const confirmed = await this.confirm('¿Fusionar estas películas?');

                        if (confirmed) {
                            try {
                                await this.movieService['connection'].post('/maintenance/merge', {
                                    id1: parseInt(id1!),
                                    id2: parseInt(id2!)
                                });
                                this.alertManager.success('Películas fusionadas');
                                target.closest('.duplicate-item')?.remove();
                            } catch (error) {
                                this.handleError(error, 'Error al fusionar');
                            }
                        }
                    });
                });

            } catch (error) {
                this.handleError(error, 'Error al escanear duplicados');
                resultsDiv.innerHTML = '<p class="error">Error al escanear</p>';
            } finally {
                this.showLoader(false);
            }
        });
    }

    private setupMissingEvents(): void {
        document.getElementById('scan-missing')?.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('missing-results');
            if (!resultsDiv) return;

            const filters = {
                rating: (document.getElementById('missing-rating') as HTMLInputElement)?.checked,
                poster: (document.getElementById('missing-poster') as HTMLInputElement)?.checked,
                description: (document.getElementById('missing-description') as HTMLInputElement)?.checked
            };

            try {
                this.showLoader(true);
                resultsDiv.innerHTML = '<p class="loading">Buscando...</p>';

                const response = await this.movieService['connection'].post('/maintenance/missing', filters);
                const movies = response.data;

                if (movies.length === 0) {
                    resultsDiv.innerHTML = '<p class="success">No se encontraron películas incompletas</p>';
                    return;
                }

                resultsDiv.innerHTML = `
                    <h4>${movies.length} películas con información incompleta</h4>
                    <table class="missing-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Faltante</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movies.map((movie: any) => `
                                <tr>
                                    <td>${movie.id}</td>
                                    <td>${movie.title}</td>
                                    <td>${movie.missing.join(', ')}</td>
                                    <td>
                                        <button class="btn btn-primary fix-movie" data-id="${movie.id}">
                                            Corregir
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;

                // Eventos para corregir
                document.querySelectorAll('.fix-movie').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.target as HTMLElement;
                        const id = target.dataset.id;

                        try {
                            await this.movieService.updateFromInternet(parseInt(id!));
                            this.alertManager.success('Película actualizada');
                            target.closest('tr')?.remove();
                        } catch (error) {
                            this.handleError(error, 'Error al actualizar');
                        }
                    });
                });

            } catch (error) {
                this.handleError(error, 'Error al buscar películas incompletas');
                resultsDiv.innerHTML = '<p class="error">Error al buscar</p>';
            } finally {
                this.showLoader(false);
            }
        });
    }

    private setupCleanupEvents(): void {
        document.getElementById('run-cleanup')?.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('cleanup-results');
            if (!resultsDiv) return;

            const options = {
                cache: (document.getElementById('clean-cache') as HTMLInputElement)?.checked,
                logs: (document.getElementById('clean-logs') as HTMLInputElement)?.checked,
                temp: (document.getElementById('clean-temp') as HTMLInputElement)?.checked
            };

            try {
                this.showLoader(true);
                resultsDiv.innerHTML = '<p class="loading">Limpiando...</p>';

                const response = await this.movieService['connection'].post('/maintenance/cleanup', options);
                const result = response.data;

                resultsDiv.innerHTML = `
                    <div class="cleanup-result success">
                        <h4>Limpieza completada</h4>
                        <ul>
                            ${Object.entries(result).map(([key, value]) =>
                                `<li>${key}: ${value} archivos eliminados</li>`
                            ).join('')}
                        </ul>
                    </div>
                `;

                this.alertManager.success('Limpieza completada');

            } catch (error) {
                this.handleError(error, 'Error durante la limpieza');
                resultsDiv.innerHTML = '<p class="error">Error durante la limpieza</p>';
            } finally {
                this.showLoader(false);
            }
        });
    }

    private async loadBackupInfo(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/maintenance/last-backup');
            const lastBackup = response.data;

            const span = document.getElementById('last-backup');
            if (span) {
                span.textContent = lastBackup ? this.formatDate(lastBackup) : 'Nunca';
            }
        } catch (error) {
            console.error('Error loading backup info:', error);
        }
    }

    private setupBackupEvents(): void {
        document.getElementById('create-backup')?.addEventListener('click', async () => {
            const resultsDiv = document.getElementById('backup-results');
            if (!resultsDiv) return;

            const confirmed = await this.confirm('¿Crear copia de seguridad ahora?');

            if (!confirmed) return;

            try {
                this.showLoader(true);
                resultsDiv.innerHTML = '<p class="loading">Creando backup...</p>';

                const response = await this.movieService['connection'].post('/maintenance/backup', {});
                const result = response.data;

                resultsDiv.innerHTML = `
                    <div class="backup-result success">
                        <h4>Backup creado exitosamente</h4>
                        <p><strong>Archivo:</strong> ${result.filename}</p>
                        <p><strong>Tamaño:</strong> ${result.size}</p>
                        <p><strong>Fecha:</strong> ${this.formatDate(result.date)}</p>
                        <a href="${result.download_url}" class="btn btn-success" download>
                            Descargar backup
                        </a>
                    </div>
                `;

                this.alertManager.success('Backup creado');
                this.loadBackupInfo();

            } catch (error) {
                this.handleError(error, 'Error al crear backup');
                resultsDiv.innerHTML = '<p class="error">Error al crear backup</p>';
            } finally {
                this.showLoader(false);
            }
        });
    }

    cleanup(): void {
        // Limpiar eventos si es necesario
    }
}

export default MaintenanceView;
