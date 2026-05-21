import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
import { SelectDataManager } from '../services/SelectDataManager.js';
import { MovieCard } from '../components/MovieCard.js';
import { flagEmoji } from '../utils.js';
import { auth } from '../main.js';

interface SearchParams {
    id_movie?: string;
    quality?: string;
    extension?: string;
    resolution?: string;
    fps?: string;
    id_country?: string;
    min_rating?: string;
    max_rating?: string;
    min_date?: string;
    max_date?: string;
}

export class SearchView extends BaseView {
    private movieService: MovieService;
    private selectDataManager: SelectDataManager;
    private movieCards: MovieCard[] = [];
    private currentParams: SearchParams = {};

    constructor() {
        super();
        this.movieService = new MovieService();
        this.selectDataManager = SelectDataManager.getInstance();
    }

    async render(params?: SearchParams): Promise<string> {
        this.currentParams = params || {};
        const hasResults = Object.values(this.currentParams).some(value => Boolean(value));

        return `
            <div class="container-advance-search">
                <details ${hasResults ? 'open' : ''}>
                    <summary class="btn btn-primary">Búsqueda Avanzada</summary>

                    <form id="form-advance-search" method="GET">
                        <div>
                            <label for="id_movie"><span>Por ID</span>
                                <input type="number" id="id_movie" class="noborder" name="id_movie" size="8" minlength="1" maxlength="8" value="${this.currentParams.id_movie || ''}">
                            </label>
                        </div>

                        <div>
                            <label for="quality"><span>Por calidad</span>
                                <select id="quality" name="quality">
                                    <option value="">N/A</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label for="extension"><span>Por Extensión</span>
                                <select id="extension" name="extension">
                                    <option value="">N/A</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label for="resolution"><span>Por Resolución</span>
                                <select id="resolution" name="resolution">
                                    <option value="">N/A</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label for="fps"><span>Por FPS</span>
                                <select id="fps" name="fps">
                                    <option value="">N/A</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label for="id_country"><span>Por País</span>
                                <select id="id_country" name="id_country">
                                    <option value="">N/A</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label><span>Por Calificación (0/10)</span>
                                <label class="row" for="min_rating"><span>Mínimo</span>
                                    <input type="number" class="noborder" id="min_rating_value" value="${this.currentParams.min_rating || ''}" disabled>
                                    <input type="range" name="min_rating" id="min_rating" size="2" step="0.5" min="0.0" max="10.0" value="${this.currentParams.min_rating || '0'}">
                                </label>
                                <label class="row" for="max_rating"><span>Máximo</span>
                                    <input type="number" class="noborder" id="max_rating_value" value="${this.currentParams.max_rating || ''}" disabled>
                                    <input type="range" name="max_rating" id="max_rating" size="2" step="0.5" min="0.0" max="10.0" value="${this.currentParams.max_rating || '10'}">
                                </label>
                            </label>
                        </div>

                        <div>
                            <label>
                                <span>Por fecha de Creación</span>
                                <label class="row" for="min_date"><span>Fecha Inicio</span>
                                    <input type="date" name="min_date" id="min_date" min="1800-01-01" max="2900-01-01" value="${this.currentParams.min_date || ''}">
                                </label>
                                <label class="row" for="max_date"><span>Fecha Fin</span>
                                    <input type="date" name="max_date" id="max_date" min="1800-01-01" max="2900-01-01" value="${this.currentParams.max_date || ''}">
                                </label>
                            </label>
                        </div>

                        <div>
                            <button type="submit" class="btn btn-primary" data-action="search">BUSCAR</button>
                        </div>
                    </form>
                </details>

                <div id="search-results"></div>
            </div>
        `;
    }

    async afterRender(params?: SearchParams): Promise<void> {
        this.currentParams = params || this.currentParams;

        await this.loadSelectOptions();
        this.syncFormControls();
        this.setupEventListeners();

        if (this.hasFilters(this.currentParams)) {
            await this.runSearch(this.currentParams);
        }
    }

    private async loadSelectOptions(): Promise<void> {
        const [qualities, extensions, resolutions, fpsList, countries] = await Promise.all([
            this.movieService.getQualities(),
            this.movieService.getExtensions(),
            this.movieService.getResolutions(),
            this.movieService.getFps(),
            this.selectDataManager.getCountries()
        ]);

        this.populateSelect('quality', qualities || []);
        this.populateSelect('extension', extensions || []);
        this.populateSelect('resolution', resolutions || []);
        this.populateSelect('fps', fpsList || []);
        // Mapear countries a formato esperado por populateCountrySelect
        const mappedCountries = (countries || []).map((c: any) => ({
            id: c.id_country || c.id || 0,
            name: c.name || '',
            value: c.code || c.name,
            code: c.code
        }));
        this.populateCountrySelect(mappedCountries);
    }

    private populateSelect(selectId: string, options: Array<{ id: number | string; name: string; value?: string }>): void {
        const select = document.getElementById(selectId) as HTMLSelectElement | null;
        if (!select) return;

        select.innerHTML = [
            '<option value="">N/A</option>',
            ...options.map(option => {
                const value = option.value || option.name || String(option.id);
                return `<option value="${this.escapeHtml(value)}">${this.escapeHtml(String(value))}</option>`;
            })
        ].join('');
    }

    private populateCountrySelect(options: Array<{ id: number | string; name: string; value?: string }>): void {
        const select = document.getElementById('id_country') as HTMLSelectElement | null;
        if (!select) return;

        select.innerHTML = [
            '<option value="">N/A</option>',
            ...options.map(option => {
                const code = String(option.value || option.name || '').trim();
                const label = `${flagEmoji(code)} ${option.name || code}`.trim();
                return `<option value="${this.escapeHtml(String(option.id))}">${this.escapeHtml(label)}</option>`;
            })
        ].join('');
    }

    private syncFormControls(): void {
        const minRating = document.getElementById('min_rating') as HTMLInputElement | null;
        const maxRating = document.getElementById('max_rating') as HTMLInputElement | null;
        const minRatingValue = document.getElementById('min_rating_value') as HTMLInputElement | null;
        const maxRatingValue = document.getElementById('max_rating_value') as HTMLInputElement | null;

        if (minRating && minRatingValue) {
            minRatingValue.value = minRating.value;
            minRating.addEventListener('input', () => {
                minRatingValue.value = minRating.value;
            });
        }

        if (maxRating && maxRatingValue) {
            maxRatingValue.value = maxRating.value;
            maxRating.addEventListener('input', () => {
                maxRatingValue.value = maxRating.value;
            });
        }

        this.setSelectValue('quality', this.currentParams.quality);
        this.setSelectValue('extension', this.currentParams.extension);
        this.setSelectValue('resolution', this.currentParams.resolution);
        this.setSelectValue('fps', this.currentParams.fps);
        this.setSelectValue('id_country', this.currentParams.id_country);
    }

    private setSelectValue(id: string, value?: string): void {
        const select = document.getElementById(id) as HTMLSelectElement | null;
        if (select && value) {
            select.value = value;
        }
    }

    protected setupEventListeners(): void {
        const form = document.getElementById('form-advance-search') as HTMLFormElement | null;
        form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const filters = this.readFormValues(form);
            const query = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && String(value).trim() !== '') {
                    query.set(key, String(value));
                }
            });

            const nextPath = `${window.location.pathname}${query.toString() ? `?${query.toString()}` : ''}`;
            this.navigate(nextPath);
        });
    }

    private async runSearch(filters: SearchParams): Promise<void> {
        const normalizedFilters = this.readNormalizedFilters(filters);
        const movies = await this.movieService.advancedSearch(normalizedFilters);
        this.renderResults(movies || []);
    }

    private renderResults(movies: any[]): void {
        const container = document.getElementById('search-results');
        if (!container) return;

        this.movieCards.forEach(card => card.getElement().remove());
        this.movieCards = [];

        if (!movies.length) {
            container.innerHTML = '<section class="maintenance-list"><h3>No se obtuvó ningún resultado</h3></section>';
            return;
        }

        const isAdmin = auth.getUser()?.role === 'admin';
        const wrapper = document.createElement('article');
        wrapper.className = 'item-list';

        movies.forEach(movie => {
            const card = new MovieCard({
                movieId: movie.id_movie,
                title: movie.title,
                year: movie.year,
                duration: movie.duration || 0,
                rating: movie.ratings || 0,
                poster: movie.urlpicture || '',
                genreId: movie.id_genre_path ?? movie.id_genre ?? 0,
                showAdmin: isAdmin
            });

            wrapper.appendChild(card.getElement());
            this.movieCards.push(card);
        });

        container.innerHTML = '';
        container.appendChild(wrapper);
    }

    private readFormValues(form: HTMLFormElement): SearchParams {
        const data = new FormData(form);
        return {
            id_movie: String(data.get('id_movie') || '').trim(),
            quality: String(data.get('quality') || '').trim(),
            extension: String(data.get('extension') || '').trim(),
            resolution: String(data.get('resolution') || '').trim(),
            fps: String(data.get('fps') || '').trim(),
            id_country: String(data.get('id_country') || '').trim(),
            min_rating: String(data.get('min_rating') || '').trim(),
            max_rating: String(data.get('max_rating') || '').trim(),
            min_date: String(data.get('min_date') || '').trim(),
            max_date: String(data.get('max_date') || '').trim()
        };
    }

    private readNormalizedFilters(params: SearchParams): Record<string, string | number | null> {
        return {
            id_movie: params.id_movie ? Number(params.id_movie) : null,
            quality: params.quality || null,
            extension: params.extension || null,
            resolution: params.resolution || null,
            fps: params.fps || null,
            id_country: params.id_country ? Number(params.id_country) : null,
            min_rating: params.min_rating || null,
            max_rating: params.max_rating || null,
            min_date: params.min_date || null,
            max_date: params.max_date || null
        };
    }

    private hasFilters(params: SearchParams): boolean {
        return Object.values(params).some(value => Boolean(value && String(value).trim()));
    }

    private escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}

export default SearchView;
