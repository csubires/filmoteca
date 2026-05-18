import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';

interface InventoryItem {
    id: string;
    title: string;
    url: string;
    description: string;
    year?: number;
    rating?: number;
    present?: boolean;
}

interface RatingProposal {
    id_rating: number;
    src_img: string;
    url: string;
    title: string;
    year: number;
    rating: number;
    is_present: number;
}

export class InventoriesView extends BaseView {
    private movieService: MovieService; // Añadir esta línea

    constructor() {
        super();
        this.movieService = new MovieService(); // Inicializar en constructor
    }
    private currentYear: number | null = null;

    async render(params?: { year?: string }): Promise<string> {
        this.currentYear = params?.year ? parseInt(params.year) : null;

        return `
            <div class="inventories-container">
                ${this.currentYear ? this.renderYearDetail() : this.renderInventoryMenu()}
            </div>
        `;
    }

    private renderInventoryMenu(): string {
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
            <section class="inventories-panel">
                <div class="menu--clickeable inventories-toggle">

                    <label class="menu-icon" for="menu-btn">
                        <span>Listados disponibles</span>
                        <span class="navicon"></span>
                    </label>
                </div>

                <div class="inventories-grid">
                    ${inventories.map(inv => `
                        <a class="inventory-card"
                           target="_blank"
                           data-descr="${inv.desc}"
                           href="/inventories/${inv.file}">
                            <strong>${inv.name}</strong>
                            <small>${inv.desc}</small>
                        </a>
                    `).join('')}
                </div>
            </section>

            <section class="proposals-section">
                <div class="head-result-little">
                    <h3>Películas propuestas para descargar</h3>
                </div>

                <div class="head-result years" id="years-container"></div>

                <main id="downloads-content" class="downloads-content"></main>
            </section>
        `;
    }

    private renderYearDetail(): string {
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

    async afterRender(params?: { year?: string }): Promise<void> {
        if (params?.year) {
            await this.loadYearDownloads(parseInt(params.year));
        } else {
            await this.loadAvailableYears();
        }
    }

    private async loadAvailableYears(): Promise<void> {
        try {
            const response = await this.movieService['connection'].get('/years/available');
            const years = Array.isArray(response.data) ? response.data : [];

            const container = document.getElementById('years-container');
            if (!container || !years) return;

            const normalizedYears = years
                .map((year: any) => ({ year: Number(year?.year), count: Number(year?.count || 0) }))
                .filter((year: { year: number }) => Number.isFinite(year.year))
                .sort((left: { year: number }, right: { year: number }) => right.year - left.year);

            container.innerHTML = normalizedYears.map((year: any) => `
                <a class="btn btn-primary-outline year-link"
                   data-descr="${year.count}"
                   href="/menu/inventories/${year.year}">
                    <strong>${year.year}</strong>
                </a>
            `).join('');

            const defaultYear = normalizedYears[0]?.year;
            if (defaultYear) {
                await this.loadRatingProposals(defaultYear);
            } else {
                this.renderEmptyProposals('No hay propuestas de descarga disponibles.');
            }
        } catch (error) {
            this.handleError(error, 'Error al cargar años disponibles');
        }
    }

    private async loadRatingProposals(year: number): Promise<void> {
        try {
            const proposals = await this.movieService.getRatings(year);
            const container = document.getElementById('downloads-content');

            if (!container) return;

            if (!proposals || proposals.length === 0) {
                this.renderEmptyProposals(`No hay películas propuestas para ${year}.`);
                return;
            }

            container.innerHTML = `
                <main class="table proposals-table">
                    <section class="table__header">
                        <h1>Películas propuestas para descargar ${year}</h1>
                    </section>
                    <section class="table__body">
                        <table>
                            <thead>
                                <tr>
                                    <th>Película</th>
                                    <th>Año</th>
                                    <th>Rating</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${proposals.map((item: RatingProposal) => `
                                    <tr class="proposal-row ${item.is_present ? 'present' : 'missing'}">
                                        <td>
                                            <a target="_blank" href="https://www.filmaffinity.com${item.url}">
                                                <img class="proposal-thumb" src="https://pics.filmaffinity.com${item.src_img}" alt="${item.title}">
                                                <span>${item.title}</span>
                                            </a>
                                        </td>
                                        <td>${item.year}</td>
                                        <td><strong>${Number(item.rating).toFixed(1)}</strong></td>
                                        <td>${item.is_present ? '✅ Presente' : '⬇️ Propuesta'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </section>
                </main>
            `;
        } catch (error) {
            this.handleError(error, 'Error al cargar películas propuestas');
        }
    }

    private renderEmptyProposals(message: string): void {
        const container = document.getElementById('downloads-content');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state proposals-empty">${message}</div>
        `;
    }

    private async loadYearDownloads(year: number): Promise<void> {
        try {
            this.showLoader(true);

            const response = await this.movieService['connection'].get(`/downloads/year/${year}`);
            const downloads = response.data;

            const tbody = document.getElementById('downloads-table-body');
            if (!tbody || !downloads) return;

            tbody.innerHTML = downloads.map((item: any) => `
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
                                data-title="${item.title}">
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
        } catch (error) {
            this.handleError(error, 'Error al cargar descargas');
        } finally {
            this.showLoader(false);
        }
    }

    private setupDownloadEvents(): void {
        // Marcar como presente
        document.querySelectorAll('.mark-present').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const id = target.dataset.id;
                const title = target.dataset.title;

                if (!id || !title) return;

                const confirmed = await this.confirm(`¿Marcar "${title}" como presente?`);

                if (confirmed) {
                    try {
                        await this.movieService['connection'].post('/downloads/mark-present', {
                            id: parseInt(id)
                        });

                        const row = document.getElementById(`rating-tr-${id}`);
                        if (row) {
                            row.classList.remove('missing');
                            row.classList.add('present');
                            row.querySelector('td:nth-child(3)')!.innerHTML = '✅ Presente';
                        }

                        this.alertManager.success('Película marcada como presente');
                    } catch (error) {
                        this.handleError(error, 'Error al marcar película');
                    }
                }
            });
        });

        // Ver detalles
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const id = target.dataset.id;

                // Aquí podrías abrir un modal con más detalles
                console.log('View details for:', id);
            });
        });
    }

    cleanup(): void {
        // Limpiar eventos si es necesario
    }
}

export default InventoriesView;
