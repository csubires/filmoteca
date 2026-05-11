import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { formatBytes, formatDuration } from '../utils.js';
export class StatisticsView extends BaseView {
    constructor() {
        super();
        this.charts = [];
        this.movieService = new MovieService();
    }
    async render() {
        return `
            <div class="statistics-container">
                <div class="head-result">
                    <h3>Estadísticas</h3>
                    <button class="btn btn-primary-outline" id="update-charts">
                        Actualizar
                    </button>
                </div>

                <div id="stats-container"></div>

                <div class="reports-section">
                    <div class="menu--clickeable btn btn-primary">
                        <input class="menu-btn" type="checkbox" id="menu-btn" />
                        <label class="menu-icon" for="menu-btn">
                            <span>Listado de reportes</span>
                            <span class="navicon"></span>
                        </label>
                        <div>
                            <main class="table">
                                <section class="table__header">
                                    <h1>Listado de reportes</h1>
                                </section>
                                <section class="table__body">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>HDD</th>
                                                <th>Películas</th>
                                                <th>Géneros</th>
                                                <th>Archivos</th>
                                                <th>Tamaño</th>
                                                <th>Duración</th>
                                                <th>Recientes</th>
                                                <th>Parada</th>
                                                <th>Opciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="reports-table-body"></tbody>
                                    </table>
                                </section>
                            </main>
                        </div>
                    </div>
                </div>

                <article class="container-statistics" id="charts-container"></article>
            </div>
        `;
    }
    async afterRender() {
        await Promise.all([
            this.loadCurrentStats(),
            this.loadReports(),
            this.loadCharts()
        ]);
        this.setupEventListeners();
    }
    async loadCurrentStats() {
        try {
            const response = await this.movieService['connection'].get('/stats/current');
            const stats = response.data;
            if (!stats)
                return;
            const container = document.getElementById('stats-container');
            if (!container)
                return;
            container.innerHTML = `
                <div class="container-global-data">
                    <div id="report-interno">
                        <label><b>Reporte</b><span>${this.formatDate(stats.internal.date)}</span></label>
                        <label><b>HDD</b><span>Interno (0)</span></label>
                        <label><b>Películas</b><span>${stats.internal.movies}</span></label>
                        <label><b>Nuevas</b><a href="/view/0">${stats.internal.new}</a></label>
                        <label><b>Géneros</b><span>${stats.internal.genres}</span></label>
                        <label><b>Archivos</b><span>${stats.internal.files}</span></label>
                        <label><b>Tamaño Global</b><span>${formatBytes(stats.internal.size)}</span></label>
                        <label><b>Duración Global</b><span>${formatDuration(stats.internal.duration)}</span></label>
                        <label><b>Extensiones</b><span>${stats.internal.extensions}</span></label>
                    </div>
                    <div id="report-externo">
                        <label><b>Reporte</b><span>${this.formatDate(stats.external.date)}</span></label>
                        <label><b>HDD</b><span>Externo (1)</span></label>
                        <label><b>Películas</b><span>${stats.external.movies}</span></label>
                        <label><b>Nuevas</b><a href="/view/0">${stats.external.new}</a></label>
                        <label><b>Géneros</b><span>${stats.external.genres}</span></label>
                        <label><b>Archivos</b><span>${stats.external.files}</span></label>
                        <label><b>Tamaño Global</b><span>${formatBytes(stats.external.size)}</span></label>
                        <label><b>Duración Global</b><span>${formatDuration(stats.external.duration)}</span></label>
                        <label><b>Extensiones</b><span>${stats.external.extensions}</span></label>
                    </div>
                </div>
            `;
        }
        catch (error) {
            this.handleError(error, 'Error al cargar estadísticas actuales');
        }
    }
    async loadReports() {
        try {
            const response = await this.movieService['connection'].get('/reports/all');
            const reports = response.data;
            if (!reports)
                return;
            const tbody = document.getElementById('reports-table-body');
            if (!tbody)
                return;
            const csrfToken = this.getCsrfToken();
            tbody.innerHTML = reports.map((report) => `
                <tr id="report-tr-${report.id}">
                    <td>${report.id}</td>
                    <td>${this.formatDate(report.date)}</td>
                    <td>${report.hdd === 0 ? 'Interno' : 'Externo'}</td>
                    <td>${report.movies}</td>
                    <td>${report.genres}</td>
                    <td>${report.files}</td>
                    <td>${formatBytes(report.size)}</td>
                    <td>${formatDuration(report.duration)}</td>
                    <td>${report.new}</td>
                    <td>${report.manual ? 'Manual' : 'Auto'}</td>
                    <td>
                        <button class="btn btn-danger-outline delete-report"
                                data-id="${report.id}"
                                data-csrf="${csrfToken}">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar reportes');
        }
    }
    async loadCharts() {
        try {
            const response = await this.movieService['connection'].get('/charts/list');
            const charts = response.data;
            const container = document.getElementById('charts-container');
            if (!container || !charts)
                return;
            container.innerHTML = charts.map((chart) => `
                <figure>
                    <img src="/charts/${chart}"
                         alt="Gráfica"
                         loading="lazy">
                    <figcaption>${this.getChartCaption(chart)}</figcaption>
                </figure>
            `).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar gráficas');
        }
    }
    setupEventListeners() {
        document.getElementById('update-charts')?.addEventListener('click', async () => {
            try {
                await this.movieService['connection'].post('/charts/update', {});
                this.reload();
            }
            catch (error) {
                this.handleError(error, 'Error al actualizar gráficas');
            }
        });
        document.querySelectorAll('.delete-report').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target;
                const reportId = target.dataset.id;
                const csrfToken = target.dataset.csrf;
                if (!reportId || !csrfToken)
                    return;
                const confirmed = await this.confirm('¿Eliminar este reporte?');
                if (confirmed) {
                    try {
                        await this.movieService['connection'].delete('/reports/delete', {
                            id: reportId,
                            csrf_token_form: csrfToken
                        });
                        document.getElementById(`report-tr-${reportId}`)?.remove();
                        this.alertManager.success('Reporte eliminado');
                    }
                    catch (error) {
                        this.handleError(error, 'Error al eliminar reporte');
                    }
                }
            });
        });
    }
    getChartCaption(filename) {
        const captions = {
            'films_per_year.png': 'Películas por año',
            'size_per_year.png': 'Tamaño por año',
            'duration_per_year.png': 'Duración por año',
            'genre_distribution.png': 'Distribución por género',
            'quality_distribution.png': 'Distribución por calidad',
            'hdd_comparison.png': 'Comparativa HDD'
        };
        return captions[filename] || filename;
    }
    cleanup() {
        this.charts = [];
    }
}
export default StatisticsView;
