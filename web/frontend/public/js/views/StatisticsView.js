import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { formatBytes, formatDuration } from '../utils.js';
export class StatisticsView extends BaseView {
    constructor() {
        super();
        this.movieService = new MovieService();
    }
    async render() {
        return `
            <div class="statistics-container">
                <div class="head-result">
                    <h3>Estadísticas</h3>

                </div>

                <div id="stats-container">
                    <div class="container-global-data" id="summary-container"></div>
                </div>

                <div class="menu--clickeable reports-menu">

                    <label class="menu-icon" for="reports-menu-btn">
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
                                            <th>Opción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="reports-table-body"></tbody>
                                </table>
                            </section>
                        </main>
                    </div>
                </div>
                    <button class="btn btn-primary-outline" id="update-charts">
                        Actualizar
                    </button>
                <article class="container-statistics" id="charts-container"></article>
            </div>
        `;
    }
    async afterRender() {
        await this.reloadStatistics();
        this.setupEventListeners();
    }
    setupEventListeners() {
        document.getElementById('update-charts')?.addEventListener('click', async () => {
            await this.reloadStatistics();
        });
        this.delegateReportAction();
    }
    delegateReportAction() {
        const reportsBody = document.getElementById('reports-table-body');
        if (!reportsBody)
            return;
        reportsBody.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('delete-report')) {
                this.handleDeleteReport(target);
            }
        });
    }
    async handleDeleteReport(button) {
        const reportId = button.getAttribute('data-id-report');
        if (!reportId) {
            this.alertManager.error('Error: ID de reporte no válido');
            console.warn('Missing report ID on delete button');
            return;
        }
        const confirmed = await this.confirm('¿Eliminar este reporte?');
        if (!confirmed)
            return;
        try {
            button.disabled = true;
            await this.movieService['connection'].delete('/delete_report', {
                id_report: reportId
            });
            const row = document.getElementById(`report-tr-${reportId}`);
            if (row) {
                row.style.opacity = '0.5';
                setTimeout(() => row.remove(), 300);
            }
            this.alertManager.success('Reporte eliminado correctamente');
        }
        catch (error) {
            button.disabled = false;
            this.handleError(error, 'Error al eliminar reporte');
        }
    }
    async reloadStatistics() {
        this.showLoader(true);
        try {
            const [summary, reports, years, countries, genres, extensions, ratingsInternal, ratingsExternal, worldMap, hddDistribution] = await Promise.all([
                this.movieService.getStatsSummary(),
                this.movieService.getReportsSummary(),
                this.movieService.getReportYears(),
                this.movieService.getReportCountries(),
                this.movieService.getReportGenres(),
                this.movieService.getReportExtensions(),
                this.movieService.getReportRatings(0),
                this.movieService.getReportRatings(1),
                this.movieService.getWorldMapReport(),
                this.movieService.getHddDistribution()
            ]);
            this.renderSummary(summary, reports || []);
            this.renderReports(reports || []);
            await this.renderCharts({
                years: years || [],
                countries: countries || [],
                genres: genres || [],
                extensions: extensions || [],
                ratingsInternal: ratingsInternal || [],
                ratingsExternal: ratingsExternal || [],
                worldMap: worldMap || [],
                hddDistribution: hddDistribution || []
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar estadísticas');
        }
        finally {
            this.showLoader(false);
        }
    }
    renderSummary(summary, reports) {
        const container = document.getElementById('summary-container');
        if (!container)
            return;
        const latestReports = this.getLatestReports(reports);
        const internal = latestReports.get(0);
        const external = latestReports.get(1);
        container.innerHTML = `
            <div class="summary-panel summary-panel--internal">
                <span class="summary-panel__title">Repositorio interno</span>
                ${this.renderSummaryBlock('Interno (0)', internal)}
            </div>
            <div class="summary-panel summary-panel--external">
                <span class="summary-panel__title">Repositorio externo</span>
                ${this.renderSummaryBlock('Externo (1)', external)}
            </div>
            <div class="summary-panel summary-panel--global">
                <span class="summary-panel__title">Resumen global</span>
                ${this.renderGlobalSummary(summary)}
            </div>
        `;
    }
    renderSummaryBlock(label, report) {
        if (!report) {
            return `
                <label><b>Reporte</b><span>-</span></label>
                <label><b>HDD</b><span>${label}</span></label>
                <label><b>Películas</b><span>0</span></label>
                <label><b>Nuevas</b><span>0</span></label>
                <label><b>Géneros</b><span>0</span></label>
                <label><b>Archivos</b><span>0</span></label>
                <label><b>Tamaño Global</b><span>0 Bytes</span></label>
                <label><b>Duración Global</b><span>0</span></label>
                <label><b>Extensiones</b><span>-</span></label>
            `;
        }
        const reportDate = this.pick(report, ['report_date', 'date', '1'], 1);
        const movies = this.pick(report, ['num_movies', 'movies', '2'], 2);
        const genres = this.pick(report, ['num_genres', 'genres', '3'], 3);
        const sizeText = this.pick(report, ['global_size_str', 'size_str', '5'], 5) || formatBytes(Number(this.pick(report, ['global_size', 'size', '4'], 4) || 0));
        const durationText = this.pick(report, ['global_duration_str', 'duration_str', '7'], 7) || formatDuration(Number(this.pick(report, ['global_duration', 'duration', '6'], 6) || 0));
        const extensions = this.pick(report, ['file_extensions', 'extensions', '8'], 8);
        const addRecent = this.pick(report, ['add_recent', 'new', '9'], 9);
        const manualStop = Number(this.pick(report, ['manual_stop', 'manual', '10'], 10) || 0);
        const files = this.pick(report, ['num_files', 'files', '11'], 11);
        const manualLabel = manualStop ? ' (Con parada manual)' : '';
        return `
            <label><b>Reporte${manualLabel}</b><span>${reportDate || '-'}</span></label>
            <label><b>HDD</b><span>${label}</span></label>
            <label><b>Películas</b><span>${movies ?? 0}</span></label>
            <label><b>Nuevas</b><a href="/view/0">${addRecent ?? 0}</a></label>
            <label><b>Géneros</b><span>${genres ?? 0}</span></label>
            <label><b>Archivos</b><span>${files ?? 0}</span></label>
            <label><b>Tamaño Global</b><span>${sizeText}</span></label>
            <label><b>Duración Global</b><span>${durationText}</span></label>
            <label><b>Extensiones</b><span>${extensions || '-'}</span></label>
        `;
    }
    renderGlobalSummary(summary) {
        if (!summary) {
            return `
                <label><b>Total películas</b><span>0</span></label>
                <label><b>Total géneros</b><span>0</span></label>
                <label><b>Tamaño total</b><span>0 Bytes</span></label>
                <label><b>Duración total</b><span>0</span></label>
            `;
        }
        return `
            <label><b>Total películas</b><span>${summary.total_movies ?? 0}</span></label>
            <label><b>Total géneros</b><span>${summary.total_genres ?? 0}</span></label>
            <label><b>Tamaño total</b><span>${formatBytes(Number(summary.total_size || 0))}</span></label>
            <label><b>Duración total</b><span>${formatDuration(Number(summary.total_duration || 0))}</span></label>
        `;
    }
    renderReports(reports) {
        const tbody = document.getElementById('reports-table-body');
        if (!tbody)
            return;
        tbody.innerHTML = reports.map(report => {
            const id = this.pick(report, ['id_report', 'id', '0'], 0);
            if (!id) {
                console.warn('Report missing ID:', report);
                return '';
            }
            const reportDate = this.pick(report, ['report_date', 'date', '1'], 1);
            const hddCode = Number(this.pick(report, ['hdd_code', 'hdd', '12'], 12) || 0);
            const movies = this.pick(report, ['num_movies', 'movies', '2'], 2);
            const genres = this.pick(report, ['num_genres', 'genres', '3'], 3);
            const files = this.pick(report, ['num_files', 'files', '11'], 11);
            const sizeText = this.pick(report, ['global_size_str', 'size_str', '5'], 5) || formatBytes(Number(this.pick(report, ['global_size', 'size', '4'], 4) || 0));
            const durationText = this.pick(report, ['global_duration_str', 'duration_str', '7'], 7) || formatDuration(Number(this.pick(report, ['global_duration', 'duration', '6'], 6) || 0));
            const addRecent = this.pick(report, ['add_recent', 'new', '9'], 9);
            const manualStop = Number(this.pick(report, ['manual_stop', 'manual', '10'], 10) || 0);
            const hddLabel = hddCode === 0 ? 'Interno' : 'Externo';
            return `
                <tr id="report-tr-${id}">
                    <td>${id ?? '-'}</td>
                    <td>${reportDate || '-'}</td>
                    <td>${hddLabel}</td>
                    <td>${movies ?? 0}</td>
                    <td>${genres ?? 0}</td>
                    <td>${files ?? 0}</td>
                    <td>${sizeText}</td>
                    <td>${durationText}</td>
                    <td>${addRecent ?? 0}</td>
                    <td>${manualStop ? 'Manual' : 'Auto'}</td>
                    <td>
                        <button type="button" class="btn btn-danger-outline delete-report" data-id-report="${id}" title="Eliminar este reporte">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    async renderCharts(charts) {
        const container = document.getElementById('charts-container');
        if (!container)
            return;
        const figureClasses = (large) => large ? 'large' : '';
        container.innerHTML = [
            this.renderChartFigure('Progresión del número de películas por año', this.normalizeChartData(charts.years), false),
                this.renderChartFigure('Número de películas por país', this.normalizeChartData(charts.countries, 12), false),
            this.renderChartFigure('Número de películas por género', this.normalizeChartData(charts.genres, 12), false),
            this.renderChartFigure('Número de películas por extensión', this.normalizeChartData(charts.extensions, 12), false),
            this.renderChartFigure('Valoración del repositorio interno', this.normalizeRatingsChartData(charts.ratingsInternal, 12), false),
            this.renderChartFigure('Valoración del repositorio externo', this.normalizeRatingsChartData(charts.ratingsExternal, 12), false),
            this.renderChartFigure('Distribución HDD', this.normalizeChartData(charts.hddDistribution, 12), false),
            this.renderWorldMapSummary(charts.worldMap || [])
        ].join('');
        await this.loadWorldMap(charts.worldMap || []);
    }
    renderChartFigure(title, data, large) {
        if (!data.length) {
            return `
                <figure class="stats-figure ${large ? 'large' : ''}">
                    <figcaption>${title}</figcaption>
                    <p>No hay datos para mostrar</p>
                </figure>
            `;
        }
        const maxValue = Math.max(...data.map(item => item.value), 1);
            const width = 640;
            const height = 300;
        const padding = 28;
        const plotWidth = width - padding * 2;
        const plotHeight = height - padding * 2;
        const barWidth = Math.max(12, Math.floor(plotWidth / Math.max(data.length, 1) - 8));
        const gap = 8;
        const bars = data.map((item, index) => {
            const x = padding + index * (barWidth + gap);
            const ratio = item.value / maxValue;
            const barHeight = Math.max(4, Math.round(plotHeight * ratio));
            const y = height - padding - barHeight;
            const label = this.escapeHtml(item.label);
            return `
                <g>
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4"></rect>
                    <title>${label}: ${item.value}</title>
                    <text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle">${label}</text>
                    <text x="${x + barWidth / 2}" y="${Math.max(y - 6, 14)}" text-anchor="middle">${item.value}</text>
                </g>
            `;
        }).join('');
        return `
            <figure class="stats-figure ${large ? 'large' : ''}">
                <figcaption>${title}</figcaption>
                <svg class="stats-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.escapeHtml(title)}">
                    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
                    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
                    ${bars}
                </svg>
            </figure>
        `;
    }
    renderWorldMapSummary(data) {
        if (!data.length) {
            return `
                <div class="head-result">
                    <h3>Mapa mundial con número de películas y porcentaje por países</h3>
                </div>
                <figure class="stats-figure large world-map-summary">
                    <figcaption>No hay datos para el mapa mundial</figcaption>
                    <div class="world-map-empty">
                        <div id="world-map"></div>
                        <div id="show-count">No hay datos para mostrar</div>
                    </div>
                </figure>
            `;
        }
        return `
            <div class="head-result">
                <h3>Mapa mundial con número de películas y porcentaje por países</h3>
            </div>
            <figure class="stats-figure large world-map-summary">
                <figcaption>Distribución por país</figcaption>
                <div class="world-map-empty">
                    <div id="world-map"></div>
                    <div id="show-count">Pasa el cursor sobre un país para ver sus datos</div>
                </div>
            </figure>
        `;
    }
    async loadWorldMap(rows) {
        const container = document.getElementById('world-map');
        if (!container)
            return;
        try {
            const response = await fetch('/assets/world_map.svg');
            if (!response.ok) {
                throw new Error(`No se pudo cargar el mapa mundial (${response.status})`);
            }
            container.innerHTML = await response.text();
            this.applyWorldMapData(rows);
        }
        catch (error) {
            container.innerHTML = '<p>No se pudo cargar el mapa mundial</p>';
            console.error('World map load error:', error);
        }
    }
    applyWorldMapData(rows) {
        const mapContainer = document.getElementById('world-map');
        const showCount = document.getElementById('show-count');
        if (!mapContainer || !showCount)
            return;
        const countries = this.normalizeWorldMapData(rows);
        const totalMovies = countries.reduce((sum, item) => sum + item.value, 0) || 1;
        const maxMovies = Math.max(...countries.map(item => item.value), 1);
        const countryMap = new Map(countries.map(item => [item.code, item]));
        mapContainer.querySelectorAll('path[id]').forEach(path => {
            const element = path;
            const code = (element.getAttribute('id') || '').toUpperCase();
            const country = countryMap.get(code);
            if (!country) {
                element.style.fill = 'rgba(148, 163, 184, 0.18)';
                element.setAttribute('data-count', '0');
                element.setAttribute('data-percent', '0');
                return;
            }
            const percentage = (country.value * 100) / totalMovies;
            const normalized = maxMovies > 0 ? Math.pow(country.value / maxMovies, 0.72) : 0;
                const hue = Math.round(120 - (120 * normalized));
                const saturation = 84;
                const lightness = Math.round(42 + normalized * 10);
                element.style.fill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            element.style.stroke = 'rgba(15, 23, 42, 0.25)';
            element.style.strokeWidth = '0.5';
            element.style.cursor = 'pointer';
            element.setAttribute('data-country', country.name);
            element.setAttribute('data-count', String(country.value));
            element.setAttribute('data-percent', percentage.toFixed(2));
            const updatePanel = () => {
                showCount.innerHTML = `<b>${this.escapeHtml(country.name)} (${code})</b><span>${country.value} películas (${percentage.toFixed(2)}%)</span>`;
            };
            element.addEventListener('mouseover', updatePanel);
            element.addEventListener('focus', updatePanel);
            element.addEventListener('mouseenter', updatePanel);
        });
        const topCountry = countries[0];
        if (topCountry) {
            const topPercent = ((topCountry.value * 100) / totalMovies).toFixed(2);
            showCount.innerHTML = `<b>${this.escapeHtml(topCountry.name)} (${topCountry.code})</b><span>${topCountry.value} películas (${topPercent}%)</span>`;
        }
        else {
            showCount.textContent = 'Pasa el cursor sobre un país para ver sus datos';
        }
    }
    normalizeWorldMapData(rows) {
        return rows
            .map(row => {
            const code = String(this.pick(row, ['code', 'country_code', 'id_country', '0'], 0) || '').trim().toUpperCase();
            const name = String(this.pick(row, ['country', 'name', 'label', '1'], 1) || '').trim();
            const value = Number(this.extractNumeric(row, this.pick(row, ['num_movies', 'count', 'total', 'value', '2'], 2)));
            return {
                code,
                name: name || code,
                value: Number.isFinite(value) ? value : 0
            };
        })
            .filter(item => item.code.length > 0 && item.value > 0)
            .sort((left, right) => right.value - left.value);
    }
    normalizeRatingsChartData(rows, limit = 10) {
        return rows
            .map(row => {
            const rating = this.pick(row, ['ratings', 'rating', 'score', 'label', '0'], 0);
            const value = this.pick(row, ['num_movies', 'count', 'total', 'value', '1'], 1);
            const numericRating = Number(this.extractNumeric(row, rating));
            return {
                label: String(rating ?? '').trim() || '-',
                value: Number.isFinite(Number(this.extractNumeric(row, value))) ? Number(this.extractNumeric(row, value)) : 0,
                hint: Number.isFinite(numericRating) ? String(numericRating) : undefined
            };
        })
            .filter(item => item.label !== '-')
            .sort((left, right) => Number(left.label) - Number(right.label))
            .slice(0, limit);
    }
    normalizeChartData(rows, limit = 10) {
        return rows
            .map(row => {
            const label = this.pick(row, ['name', 'country', 'label', 'year', 'extension', 'ratings', 'hdd_label', 'code', 'country_code', 'NAM', '0', '1'], 0);
            const fallbackValue = this.pick(row, ['num_movies', 'count', 'total', 'value', 'D', 'CON', '1'], 1);
            const value = Number(this.extractNumeric(row, fallbackValue));
            const hint = this.pick(row, ['code', 'country_code', 'flag', 'id_country', 'id_genre', 'COD', '0'], 0);
            return {
                label: String(label ?? '').trim() || '-',
                value: Number.isFinite(value) ? value : 0,
                hint: hint ? String(hint) : undefined
            };
        })
            .filter(item => item.label !== '-')
            .sort((left, right) => right.value - left.value)
            .slice(0, limit);
    }
    getLatestReports(reports) {
        const latest = new Map();
        reports.forEach(report => {
            const hddCode = Number(this.pick(report, ['hdd_code', 'hdd', '12'], 12) || 0);
            if (!latest.has(hddCode)) {
                latest.set(hddCode, report);
            }
        });
        return latest;
    }
    pick(row, keys, index) {
        if (Array.isArray(row)) {
            const value = row[index];
            return value === undefined || value === null ? null : value;
        }
        for (const key of keys) {
            if (key in row && row[key] !== undefined && row[key] !== null) {
                return row[key];
            }
        }
        return null;
    }
    extractNumeric(row, value) {
        const raw = value ?? (Array.isArray(row) ? row[1] ?? row[2] : null);
        const numberValue = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9.,-]/g, '').replace(',', '.'));
        return Number.isFinite(numberValue) ? numberValue : 0;
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
    cleanup() {
    }
}
export default StatisticsView;
