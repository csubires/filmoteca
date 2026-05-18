import { BaseView } from './BaseView.js';
import { TorrentService } from '../services/TorrentService.js';
export class TorrentView extends BaseView {
    constructor() {
        super();
        this.pollingInterval = null;
        this.torrentService = new TorrentService();
    }
    async render() {
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

                <div class="torrent-config card" id="torrent-config">
                    <div class="form-group">
                        <label>Tarea</label>
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
    async afterRender() {
        await Promise.all([
            this.loadConfig(),
            this.loadMovies(),
            this.loadSeries()
        ]);
        this.setupEventListeners();
        await this.torrentService.checkInitialState();
        this.setupTaskSelector();
    }
    setupTaskSelector() {
        const taskSelect = document.getElementById('task-select');
        const configArea = document.getElementById('task-config-area');
        if (!taskSelect || !configArea)
            return;
        const renderConfigFor = (task) => {
            if (task === 'torrent') {
                configArea.innerHTML = `
                    <div class="form-group">
                        <label>Último torrent</label>
                        <input type="text" id="last-torrent" value="">
                    </div>
                    <div class="form-group">
                        <label>Páginas de series</label>
                        <input type="range" id="np-series" min="0" max="10" step="1" value="1">
                    </div>
                `;
            }
            else if (task === 'local') {
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
            }
            else {
                configArea.innerHTML = `<p>No hay opciones de configuración para esta tarea.</p>`;
            }
        };
        taskSelect.addEventListener('change', (e) => {
            renderConfigFor(e.target.value);
        });
        renderConfigFor(taskSelect.value);
    }
    async loadConfig() {
        try {
            const config = await this.torrentService.getConfig();
            const container = document.getElementById('torrent-config');
            if (!container)
                return;
            const lastTorrent = document.getElementById('last-torrent');
            if (lastTorrent)
                lastTorrent.value = config?.url_end || '';
            const lastDate = document.getElementById('last-date');
            if (lastDate)
                lastDate.value = config?.date_end || '';
            const npSeries = document.getElementById('np-series');
            if (npSeries)
                npSeries.value = String(config?.npseries || 0);
        }
        catch (error) {
            this.handleError(error, 'Error al cargar configuración');
        }
    }
    async loadMovies() {
        try {
            const movies = await this.torrentService.getMovies();
            this.renderMovies(movies || []);
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas');
        }
    }
    async loadSeries() {
        try {
            const series = await this.torrentService.getSeries();
            this.renderSeries(series || []);
        }
        catch (error) {
            this.handleError(error, 'Error al cargar series');
        }
    }
    renderMovies(movies) {
        const container = document.getElementById('torrent-content');
        if (!container)
            return;
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
    renderSeries(series) {
        const container = document.getElementById('torrent-content');
        if (!container)
            return;
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
    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                const tab = target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                if (tab === 'movies') {
                    this.loadMovies();
                }
                else {
                    this.loadSeries();
                }
            });
        });
        document.getElementById('save-config')?.addEventListener('click', async (e) => {
            const target = e.target;
            const csrfToken = target.dataset.csrf;
            const config = {
                url_end: document.getElementById('last-torrent')?.value || '',
                date_end: document.getElementById('last-date')?.value || '',
                npseries: parseInt(document.getElementById('np-series')?.value || '0')
            };
            try {
                await this.torrentService.saveConfig(config);
                this.alertManager.success('Configuración guardada');
            }
            catch (error) {
                this.handleError(error, 'Error al guardar configuración');
            }
        });
        document.getElementById('search-torrents')?.addEventListener('click', async () => {
            await this.startTorrentSearch();
        });
        document.getElementById('cancel-task')?.addEventListener('click', async () => {
            await this.torrentService.stopTask();
            this.hideProgress();
            this.alertManager.info('Búsqueda cancelada');
        });
        window.addEventListener('torrent-task-complete', ((e) => {
            this.hideProgress();
            if (e.detail.task_status === 'completed') {
                this.alertManager.success('Búsqueda completada');
                this.loadMovies();
                this.loadSeries();
            }
            else if (e.detail.task_status === 'failed') {
                this.alertManager.error(e.detail.error || 'Error en la búsqueda');
            }
        }));
    }
    async startTorrentSearch() {
        try {
            this.showProgress();
            this.clearLogs();
            this.addLog('Iniciando búsqueda de torrents...');
            const taskSelect = document.getElementById('task-select');
            const selectedTask = taskSelect ? taskSelect.value : 'torrent';
            let config = {};
            if (selectedTask === 'torrent') {
                config = {
                    url_end: document.getElementById('last-torrent')?.value || null,
                    npseries: parseInt(document.getElementById('np-series')?.value || '1')
                };
            }
            else if (selectedTask === 'local') {
                config = {
                    hdd: parseInt(document.getElementById('hdd')?.value || '0'),
                    stats: !!document.getElementById('stats')?.checked
                };
            }
            const taskId = await this.torrentService.startTask(selectedTask, config);
            if (!taskId) {
                throw new Error('No se pudo iniciar la tarea');
            }
            this.addLog(`Tarea iniciada: ${taskId} (${selectedTask})`);
            const pollInterval = window.setInterval(async () => {
                try {
                    const status = await this.torrentService.getTaskStatus(taskId);
                    if (status?.task_status === 'completed' || status?.task_status === 'failed') {
                        clearInterval(pollInterval);
                        this.updateProgress(100, status?.task_status === 'completed' ? 'Búsqueda completada' : 'Error en búsqueda');
                        this.hideProgress();
                        if (status?.task_status === 'completed') {
                            this.alertManager.success('Búsqueda completada');
                            setTimeout(() => {
                                this.loadMovies();
                                this.loadSeries();
                            }, 1000);
                        }
                        else {
                            this.alertManager.error(status?.error || 'Error en la búsqueda');
                        }
                    }
                    else {
                        this.updateProgress(status?.progress || 0, status?.message || 'Buscando...');
                    }
                }
                catch (error) {
                    this.addLog(`Error en polling: ${error}`);
                }
            }, 2000);
        }
        catch (error) {
            this.hideProgress();
            this.handleError(error, 'Error al iniciar búsqueda');
        }
    }
    showProgress() {
        const progressDiv = document.getElementById('torrent-progress');
        if (progressDiv) {
            progressDiv.style.display = 'block';
        }
        this.updateProgress(0, 'Iniciando...');
    }
    hideProgress() {
        const progressDiv = document.getElementById('torrent-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    updateProgress(percent, message) {
        const bar = document.getElementById('progress-bar');
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
    addLog(message) {
        const logsArea = document.getElementById('torrent-logs');
        if (logsArea) {
            const timestamp = new Date().toLocaleTimeString();
            logsArea.value += `[${timestamp}] ${message}\n`;
            logsArea.scrollTop = logsArea.scrollHeight;
        }
    }
    clearLogs() {
        const logsArea = document.getElementById('torrent-logs');
        if (logsArea) {
            logsArea.value = '';
        }
    }
    getRatingClass(rating) {
        if (rating >= 7)
            return 'high';
        if (rating >= 5)
            return 'medium';
        return 'low';
    }
    cleanup() {
        this.hideProgress();
    }
}
export default TorrentView;
