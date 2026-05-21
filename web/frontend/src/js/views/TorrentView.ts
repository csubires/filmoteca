import { BaseView } from './BaseView.js';
import { TorrentService } from '../services/TorrentService.js';
import { TorrentConfig, TorrentMovie, TorrentSerie } from '../types/torrent.types.js';

export class TorrentView extends BaseView {
    private torrentService: TorrentService;
    private pollingInterval: number | null = null;
    private lastTaskOutputLength: number = 0;
    private taskCompleteListener?: EventListener;

    constructor() {
        super();
        this.torrentService = new TorrentService();
    }

    async render(): Promise<string> {
        return `
            <div class="torrent-container">
                <div class="torrent-header">
                    <h1>Gestor de Tareas</h1>
                </div>

                <div class="torrent-config card" id="run-task">
                    <div class="form-group">
                        <label>Tareas</label>
                        <select id="task-select">
                            <option value="torrent">Buscar Torrents</option>
                            <option value="local">Escaneo Local</option>
                            <option value="inet">Actualizar Internet</option>
                            <option value="ranking">Ranking</option>
                            <option value="covers">Comprobar Portadas</option>
                            <option value="backup">Backup</option>
                            <option value="reduce">Reducir Imágenes</option>
                        </select>
                    </div>
                    <div id="task-config-area"></div>
                    <div class="form-actions">
                        <button id="save-config" class="btn btn-primary" style="display:none;">Guardar configuración</button>
                        <button id="search-torrents" class="btn btn-success">Ejecutar tarea</button>
                    </div>
                </div>

                <div id="torrent-progress" class="progress-section" style="display: none;">
                    <h3>Estado de la búsqueda</h3>
                    <div class="progress-wrapper">
                        <div class="progress-bar-container">
                            <div id="progress-bar" class="progress-bar" style="width: 0%; background: linear-gradient(90deg, #3498db, #2ecc71); height: 30px; border-radius: 4px;"></div>
                        </div>
                        <span id="progress-percent" class="progress-percent">0%</span>
                    </div>
                    <p id="progress-message" class="progress-message">Iniciando búsqueda...</p>
                    <textarea id="torrent-logs" class="torrent-logs" readonly style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #f5f5f5; font-family: monospace; font-size: 12px; margin-top: 10px;"></textarea>
                    <button id="cancel-task" class="btn btn-danger" style="margin-top: 10px;">Cancelar búsqueda</button>
                </div>

                <div class="torrent-tabs">
                    <button class="tab-btn active" data-tab="movies">Películas</button>
                    <button class="tab-btn" data-tab="series">Series</button>
                </div>

                <div id="torrent-content" class="torrent-content"></div>
            </div>
        `;
    }

    async afterRender(): Promise<void> {
        await Promise.all([
            this.loadMovies(),
            this.loadSeries()
        ]);

        this.setupTaskSelector();
        await this.loadConfig();
        this.setupEventListeners();
        await this.torrentService.checkInitialState();
    }

    private setupTaskSelector(): void {
        const taskSelect = document.getElementById('task-select') as HTMLSelectElement;
        const configArea = document.getElementById('task-config-area');
        if (!taskSelect || !configArea) return;

        const renderConfigFor = (task: string) => {
            if (task === 'torrent') {
                configArea.innerHTML = `
                    <div class="form-group">
                        <a href="https://rojotorrent.com/descargar-peliculas"
                           target="_blank"
                           class="btn btn-danger-link">
                            Ir a RojoTorrent
                        </a>
                    </div>
                    <div class="form-group">
                        <label>Último torrent</label>
                        <input type="text" id="last-torrent" value="">
                    </div>
                    <div class="form-group">
                        <label>Páginas de series</label>
                        <input type="range" id="np-series" min="0" max="10" step="1" value="1">
                    </div>
                `;
            } else if (task === 'local') {
                configArea.innerHTML = `
                    <div class="form-group">
                        <label>HDD</label>
                        <input type="number" id="hdd" value="0">
                    </div>
                    <div class="form-group">
                        <label>Actualizar estadísticas</label>
                        <input type="checkbox" id="stats" checked>
                    </div>
                `;
            } else {
                configArea.innerHTML = `<p>No hay opciones de configuración para esta tarea.</p>`;
            }
        };

        taskSelect.addEventListener('change', (e) => {
            renderConfigFor((e.target as HTMLSelectElement).value);
        });

        // Inicializar
        renderConfigFor(taskSelect.value);
    }

    private async loadConfig(): Promise<void> {
        try {
            const config = await this.torrentService.getConfig();
            const container = document.getElementById('run-task');
            if (!container) return;

            // Set values only if the inputs exist (do not overwrite task selector)
            const lastTorrent = document.getElementById('last-torrent') as HTMLInputElement;
            if (lastTorrent) lastTorrent.value = config?.url_end || '';

            const lastDate = document.getElementById('last-date') as HTMLInputElement;
            if (lastDate) lastDate.value = config?.date_end || '';

            const npSeries = document.getElementById('np-series') as HTMLInputElement;
            if (npSeries) npSeries.value = String(config?.npseries || 0);

            // Session is authenticated through httpOnly JWT cookie.
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
        this.taskCompleteListener = ((e: CustomEvent) => {
            this.hideProgress();

            if (e.detail.task_status === 'completed') {
                this.alertManager.success('Búsqueda completada');
                this.loadMovies();
                this.loadSeries();
            } else if (e.detail.task_status === 'failed') {
                this.alertManager.error(e.detail.error || 'Error en la búsqueda');
            }
        }) as EventListener;

        window.removeEventListener('torrent-task-complete', this.taskCompleteListener);
        window.addEventListener('torrent-task-complete', this.taskCompleteListener);
    }

    private async startTorrentSearch(): Promise<void> {
        try {
            this.showProgress();
            this.clearLogs();
            this.lastTaskOutputLength = 0;
            this.addLog('Iniciando búsqueda de torrents...');

            const taskSelect = document.getElementById('task-select') as HTMLSelectElement;
            const selectedTask = taskSelect ? taskSelect.value : 'torrent';

            // Build config depending on task
            let config: any = {};
            if (selectedTask === 'torrent') {
                config = {
                    url_end: (document.getElementById('last-torrent') as HTMLInputElement)?.value || null,
                    npseries: parseInt((document.getElementById('np-series') as HTMLInputElement)?.value || '1')
                };
            } else if (selectedTask === 'local') {
                config = {
                    hdd: parseInt((document.getElementById('hdd') as HTMLInputElement)?.value || '0'),
                    stats: !!(document.getElementById('stats') as HTMLInputElement)?.checked
                };
            }

            const taskId = await this.torrentService.startTask(selectedTask, config);

            if (!taskId) {
                throw new Error('No se pudo iniciar la tarea');
            }

            this.addLog(`Tarea iniciada: ${taskId} (${selectedTask})`);
            this.updateProgress(1, 'Tarea iniciada');

            // Polling real del estado
            this.pollingInterval = window.setInterval(async () => {
                try {
                    const status = await this.torrentService.getTaskStatus(taskId);

                    if (status?.output && status.output.length > this.lastTaskOutputLength) {
                        const newOutput = status.output.slice(this.lastTaskOutputLength);
                        this.lastTaskOutputLength = status.output.length;
                        newOutput.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => this.addLog(line));
                    }

                    const outputProgress = this.extractProgressFromOutput(status?.output || '');
                    const progressValue = Math.max(status?.progress || 0, outputProgress);

                    if (status?.task_status === 'completed' ||
                        status?.task_status === 'failed' ||
                        status?.task_status === 'cancelled' ||
                        status?.task_status === 'not_found') {
                        if (this.pollingInterval) {
                            clearInterval(this.pollingInterval);
                            this.pollingInterval = null;
                        }
                        this.updateProgress(100, status?.task_status === 'completed' ? 'Búsqueda completada' : 'Error en búsqueda');
                        this.hideProgress();

                        if (status?.task_status === 'completed') {
                        this.updateProgress(progressValue, status?.message || 'Buscando...');
                            setTimeout(() => {
                                this.loadMovies();
                                this.loadSeries();
                            }, 1000);
                        } else if (status?.task_status === 'cancelled') {
                            this.alertManager.info('Búsqueda cancelada');
                        } else if (status?.task_status === 'not_found') {
                            this.alertManager.warning('La tarea ya no está disponible en el servidor');
                        } else {
                            this.alertManager.error(status?.error || 'Error en la búsqueda');
                        }
                    } else {
                        this.updateProgress(status?.progress || 0, status?.message || 'Buscando...');
                    }
                } catch (error) {
                    this.addLog(`Error en polling: ${error}`);
                    if (this.pollingInterval) {
                        clearInterval(this.pollingInterval);
                        this.pollingInterval = null;
                    }
                    this.hideProgress();
                }
            }, 2000);

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
        const bar = document.getElementById('progress-bar') as HTMLElement;
        const percentEl = document.getElementById('progress-percent');
        const msgEl = document.getElementById('progress-message');

        if (bar) {
            bar.style.width = `${percent}%`;
        }
        if (percentEl) {
            percentEl.textContent = `${percent}%`;
        }
        if (msgEl) {
            msgEl.textContent = message;
        }
    }

    private addLog(message: string): void {
        const logsArea = document.getElementById('torrent-logs') as HTMLTextAreaElement;
        if (logsArea) {
            const timestamp = new Date().toLocaleTimeString();
            logsArea.value += `[${timestamp}] ${message}\n`;
            logsArea.scrollTop = logsArea.scrollHeight;
        }
    }

    private extractProgressFromOutput(output: string): number {
        if (!output) return 0;
        const matches = output.match(/PROGRESO:(\d+)/g);
        if (!matches || matches.length === 0) return 0;
        const lastMatch = matches[matches.length - 1];
        const value = parseInt(lastMatch.replace('PROGRESO:', ''));
        return Number.isFinite(value) ? value : 0;
    }

    private clearLogs(): void {
        const logsArea = document.getElementById('torrent-logs') as HTMLTextAreaElement;
        if (logsArea) {
            logsArea.value = '';
        }
    }

    private getRatingClass(rating: number): string {
        if (rating >= 7) return 'high';
        if (rating >= 5) return 'medium';
        return 'low';
    }

    cleanup(): void {
        this.hideProgress();
        if (this.taskCompleteListener) {
            window.removeEventListener('torrent-task-complete', this.taskCompleteListener);
            this.taskCompleteListener = undefined;
        }
    }
}

export default TorrentView;
