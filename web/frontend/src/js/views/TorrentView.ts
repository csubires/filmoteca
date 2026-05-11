import { BaseView } from './BaseView.js';
import { TorrentService } from '../services/TorrentService.js';
import { TorrentConfig, TorrentMovie, TorrentSerie } from '../types/torrent.types.js';

export class TorrentView extends BaseView {
    private torrentService: TorrentService;
    private pollingInterval: number | null = null;

    constructor() {
        super();
        this.torrentService = new TorrentService();
    }

    async render(): Promise<string> {
        return `
            <div class="torrent-container">
                <div class="torrent-header">
                    <h1>Gestor de Torrents</h1>
                    <a href="https://rojotorrent.com/descargar-peliculas"
                       target="_blank"
                       class="btn btn-danger-link">
                        Ir a RojoTorrent
                    </a>
                </div>

                <div class="torrent-config card" id="torrent-config"></div>

                <div class="torrent-tabs">
                    <button class="tab-btn active" data-tab="movies">Películas</button>
                    <button class="tab-btn" data-tab="series">Series</button>
                </div>

                <div id="torrent-content" class="torrent-content"></div>

                <div id="torrent-progress" class="progress-container" style="display: none;">
                    <div class="progress">
                        <div id="progress-bar" class="progress-bar" style="width: 0%"></div>
                    </div>
                    <p id="progress-message">Iniciando búsqueda...</p>
                    <button id="cancel-task" class="btn btn-danger">Cancelar</button>
                </div>
            </div>
        `;
    }

    async afterRender(): Promise<void> {
        await Promise.all([
            this.loadConfig(),
            this.loadMovies(),
            this.loadSeries()
        ]);

        this.setupEventListeners();
        await this.torrentService.checkInitialState();
    }

    private async loadConfig(): Promise<void> {
        try {
            const config = await this.torrentService.getConfig();
            const container = document.getElementById('torrent-config');

            if (!container) return;

            const csrfToken = this.getCsrfToken();

            container.innerHTML = `
                <h3>Configuración</h3>
                <div class="config-form">
                    <div class="form-group">
                        <label>Último torrent</label>
                        <input type="text" id="last-torrent" value="${config?.url_end || ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="text" id="last-date" value="${config?.date_end || ''}">
                    </div>
                    <div class="form-group">
                        <label>Páginas de series (${config?.npseries || 0})</label>
                        <input type="range" id="np-series" min="0" max="10" step="1"
                               value="${config?.npseries || 0}">
                    </div>
                    <div class="form-actions">
                        <button id="save-config" class="btn btn-primary" data-csrf="${csrfToken}">
                            Guardar configuración
                        </button>
                        <button id="search-torrents" class="btn btn-success">
                            Buscar nuevos torrents
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            this.handleError(error, 'Error al cargar configuración');
        }
    }

    private async loadMovies(): Promise<void> {
        try {
            const movies = await this.torrentService.getMovies();
            this.renderMovies(movies || []);
        } catch (error) {
            this.handleError(error, 'Error al cargar películas');
        }
    }

    private async loadSeries(): Promise<void> {
        try {
            const series = await this.torrentService.getSeries();
            this.renderSeries(series || []);
        } catch (error) {
            this.handleError(error, 'Error al cargar series');
        }
    }

    private renderMovies(movies: TorrentMovie[]): void {
        const container = document.getElementById('torrent-content');
        if (!container) return;

        if (movies.length === 0) {
            container.innerHTML = '<p class="no-data">No hay películas disponibles</p>';
            return;
        }

        container.innerHTML = `
            <div class="torrent-list movies">
                ${movies.map(movie => `
                    <article class="torrent-item">
                        <span class="index">#${movie.index}</span>
                        <span class="rating ${this.getRatingClass(movie.rating)}">
                            ${movie.rating.toFixed(1)}
                        </span>
                        <span class="title">${movie.title}</span>
                        <span class="year">${movie.year}</span>
                        <span class="actions">
                            <a href="${movie.url_imbd}" target="_blank" class="link">IMBD</a>
                            <a href="${movie.url_rojo}" target="_blank" class="link torrent">TORRENT</a>
                            <a href="${movie.url_filma}" target="_blank" class="link">FILMAFFINITY</a>
                            <a href="https://www.youtube.com/results?search_query=trailer ${movie.title}"
                               target="_blank" class="link">TRAILER</a>
                        </span>
                    </article>
                `).join('')}
            </div>
        `;
    }

    private renderSeries(series: TorrentSerie[]): void {
        const container = document.getElementById('torrent-content');
        if (!container) return;

        if (series.length === 0) {
            container.innerHTML = '<p class="no-data">No hay series disponibles</p>';
            return;
        }

        container.innerHTML = `
            <div class="torrent-list series">
                ${series.map(serie => `
                    <article class="torrent-item">
                        <span class="index">#${serie.index}</span>
                        <span class="chapters">${serie.chapters} cap.</span>
                        <span class="title">${serie.title}</span>
                        <span class="actions">
                            <a href="${serie.url_rojo}" target="_blank" class="link torrent">TORRENT</a>
                            <a href="${serie.url_filma}" target="_blank" class="link">FILMAFFINITY</a>
                        </span>
                    </article>
                `).join('')}
            </div>
        `;
    }

    protected setupEventListeners(): void {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tab = target.dataset.tab;

                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                if (tab === 'movies') {
                    this.loadMovies();
                } else {
                    this.loadSeries();
                }
            });
        });

        // Guardar configuración
        document.getElementById('save-config')?.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const csrfToken = target.dataset.csrf;

            const config: TorrentConfig = {
                url_end: (document.getElementById('last-torrent') as HTMLInputElement)?.value || '',
                date_end: (document.getElementById('last-date') as HTMLInputElement)?.value || '',
                npseries: parseInt((document.getElementById('np-series') as HTMLInputElement)?.value || '0')
            };

            try {
                await this.torrentService.saveConfig(config);
                this.alertManager.success('Configuración guardada');
            } catch (error) {
                this.handleError(error, 'Error al guardar configuración');
            }
        });

        // Buscar torrents
        document.getElementById('search-torrents')?.addEventListener('click', async () => {
            await this.startTorrentSearch();
        });

        // Cancelar tarea
        document.getElementById('cancel-task')?.addEventListener('click', async () => {
            await this.torrentService.stopTask();
            this.hideProgress();
            this.alertManager.info('Búsqueda cancelada');
        });

        // Escuchar eventos de tarea completada
        window.addEventListener('torrent-task-complete', ((e: CustomEvent) => {
            this.hideProgress();

            if (e.detail.task_status === 'completed') {
                this.alertManager.success('Búsqueda completada');
                this.loadMovies();
                this.loadSeries();
            } else if (e.detail.task_status === 'failed') {
                this.alertManager.error(e.detail.error || 'Error en la búsqueda');
            }
        }) as EventListener);
    }

    private async startTorrentSearch(): Promise<void> {
        try {
            this.showProgress();

            const taskId = await this.torrentService.startTask();

            if (!taskId) {
                throw new Error('No se pudo iniciar la tarea');
            }

            // Simular progreso mientras se busca
            let progress = 0;
            this.pollingInterval = window.setInterval(() => {
                progress = Math.min(progress + 5, 90);
                this.updateProgress(progress, 'Buscando torrents...');
            }, 1000);

        } catch (error) {
            this.hideProgress();
            this.handleError(error, 'Error al iniciar búsqueda');
        }
    }

    private showProgress(): void {
        const progressDiv = document.getElementById('torrent-progress');
        if (progressDiv) {
            progressDiv.style.display = 'block';
        }
        this.updateProgress(0, 'Iniciando...');
    }

    private hideProgress(): void {
        const progressDiv = document.getElementById('torrent-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private updateProgress(percent: number, message: string): void {
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-message');

        if (bar) {
            bar.style.width = `${percent}%`;
        }
        if (text) {
            text.textContent = message;
        }
    }

    private getRatingClass(rating: number): string {
        if (rating >= 7) return 'high';
        if (rating >= 5) return 'medium';
        return 'low';
    }

    cleanup(): void {
        this.hideProgress();
    }
}

export default TorrentView;
