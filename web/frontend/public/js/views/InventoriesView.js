import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
export class InventoriesView extends BaseView {
    constructor() {
        super();
        this.currentYear = null;
        this.movieService = new MovieService();
    }
    async render(params) {
        this.currentYear = params?.year ? parseInt(params.year) : null;
        return `
            <div class="inventories-container">
                ${this.currentYear ? this.renderYearDetail() : this.renderInventoryMenu()}
            </div>
        `;
    }
    renderInventoryMenu() {
        const inventories = [
            { name: 'Libros', desc: 'Colección de libros en PDF', file: '20230327_Listado Libros.html' },
            { name: 'Miscellaneous', desc: 'Canciones sueltas', file: '20230327_Listado Miscellaneous.html' },
            { name: 'Música', desc: 'Discografías de artístas', file: '20230327_Listado Música.html' },
            { name: 'Películas', desc: 'Películas en el disco interno', file: '20230328_Listado Películas.html' },
            { name: 'Películas EXTRA', desc: 'Películas de peor calidad', file: '20230328_Listado Películas EXTRA.html' },
            { name: 'Series', desc: 'Listado de series por categorías', file: '20230328_Listado Series.html' },
            { name: 'Series EXTRA', desc: 'Listado de series peor valoradas', file: '20230328_Listado Series EXTRA.html' }
        ];
        return `
            <div class="menu--clickeable btn btn-primary">
                <input class="menu-btn" type="checkbox" id="menu-btn" />
                <label class="menu-icon" for="menu-btn">
                    <span>Listados disponibles</span>
                    <span class="navicon"></span>
                </label>
                <div class="inventories-grid">
                    ${inventories.map(inv => `
                        <a class="btn btn-primary-outline inventory-card"
                           target="_blank"
                           data-descr="${inv.desc}"
                           href="/inventories/${inv.file}">
                            <strong>${inv.name}</strong>
                            <small>${inv.desc}</small>
                        </a>
                    `).join('')}
                </div>
            </div>

            <div class="head-result-little">
                <h3>Películas propuestas para descargar</h3>
            </div>

            <div class="head-result years" id="years-container"></div>

            <div id="downloads-content"></div>
        `;
    }
    renderYearDetail() {
        return `
            <main class="table">
                <section class="table__header">
                    <h1>Películas de ${this.currentYear}</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Rating</th>
                                <th>Estado</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody id="downloads-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    async afterRender(params) {
        if (params?.year) {
            await this.loadYearDownloads(parseInt(params.year));
        }
        else {
            await this.loadAvailableYears();
        }
    }
    async loadAvailableYears() {
        try {
            const response = await this.movieService['connection'].get('/downloads/years');
            const years = response.data;
            const container = document.getElementById('years-container');
            if (!container || !years)
                return;
            container.innerHTML = years.map((year) => `
                <a class="btn btn-primary-outline year-link"
                   data-descr="${year.count}"
                   href="/menu/inventories/${year.year}">
                    <strong>${year.year}</strong>
                </a>
            `).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar años disponibles');
        }
    }
    async loadYearDownloads(year) {
        try {
            this.showLoader(true);
            const response = await this.movieService['connection'].get(`/downloads/year/${year}`);
            const downloads = response.data;
            const tbody = document.getElementById('downloads-table-body');
            if (!tbody || !downloads)
                return;
            const csrfToken = this.getCsrfToken();
            tbody.innerHTML = downloads.map((item) => `
                <tr id="rating-tr-${item.id}" class="${item.present ? 'present' : 'missing'}">
                    <td>
                        <a target="_blank" href="https://www.filmaffinity.com${item.url}">
                            ${item.title}
                        </a>
                    </td>
                    <td><strong>${item.rating}</strong></td>
                    <td>${item.present ? '✅ Presente' : '❌ Pendiente'}</td>
                    <td>
                        <button class="btn btn-danger-outline mark-present"
                                data-id="${item.id}"
                                data-title="${item.title}"
                                data-csrf="${csrfToken}">
                            Marcar como presente
                        </button>
                        <button class="btn btn-info-outline view-details"
                                data-id="${item.id}">
                            Ver detalles
                        </button>
                    </td>
                </tr>
            `).join('');
            this.setupDownloadEvents();
        }
        catch (error) {
            this.handleError(error, 'Error al cargar descargas');
        }
        finally {
            this.showLoader(false);
        }
    }
    setupDownloadEvents() {
        document.querySelectorAll('.mark-present').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target;
                const id = target.dataset.id;
                const title = target.dataset.title;
                const csrfToken = target.dataset.csrf;
                if (!id || !title || !csrfToken)
                    return;
                const confirmed = await this.confirm(`¿Marcar "${title}" como presente?`);
                if (confirmed) {
                    try {
                        await this.movieService['connection'].post('/downloads/mark-present', {
                            id: parseInt(id),
                            csrf_token_form: csrfToken
                        });
                        const row = document.getElementById(`rating-tr-${id}`);
                        if (row) {
                            row.classList.remove('missing');
                            row.classList.add('present');
                            row.querySelector('td:nth-child(3)').innerHTML = '✅ Presente';
                        }
                        this.alertManager.success('Película marcada como presente');
                    }
                    catch (error) {
                        this.handleError(error, 'Error al marcar película');
                    }
                }
            });
        });
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target;
                const id = target.dataset.id;
                console.log('View details for:', id);
            });
        });
    }
    cleanup() {
    }
}
export default InventoriesView;
