import { Renderer } from '../core/renderer.js';
import { MovieService } from '../services/MovieService.js';
import { SelectDataManager } from '../services/SelectDataManager.js';
import { AlertManager } from './AlertManager.js';
import { flagEmoji } from '../utils.js';

export interface ModalConfig {
    id: string;
    title: string;
    content: string;
    size?: 'small' | 'medium' | 'large';
    buttons?: ModalButton[];
    onOpen?: () => void;
    onClose?: () => void;
}

export interface ModalButton {
    text: string;
    type?: 'primary' | 'secondary' | 'danger' | 'warning';
    action: string;
    closeOnClick?: boolean;
}

export class ModalManager {
    private static instance: ModalManager;
    private renderer: Renderer;
    private activeModal: HTMLElement | null = null;
    private movieService: MovieService;
    private selectDataManager: SelectDataManager;
    private alertManager: AlertManager;

    private constructor() {
        this.renderer = Renderer.getInstance();
        this.movieService = new MovieService();
        this.selectDataManager = SelectDataManager.getInstance();
        this.alertManager = AlertManager.getInstance();
        this.createModalContainer();
    }

    static getInstance(): ModalManager {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    private createModalContainer(): void {
        if (document.getElementById('modal-container')) return;

        const container = document.createElement('div');
        container.id = 'modal-container';
        container.innerHTML = `
            <div id="modal-overlay" class="modal-overlay"></div>
            <div id="modal-content" class="modal-content"></div>
        `;
        document.body.appendChild(container);
    }

    open(config: ModalConfig): void {
        const container = document.getElementById('modal-container');
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        if (!overlay || !content || !container) return;

        // Crear HTML del modal
        content.innerHTML = `
            <div class="modal-header">
                <h3>${config.title}</h3>
                <button class="modal-close" data-action="close-modal">&times;</button>
            </div>
            <div class="modal-body ${config.size || 'medium'}">
                ${config.content}
            </div>
            ${config.buttons ? `
                <div class="modal-footer">
                    ${config.buttons.map(btn => `
                        <button class="btn btn-${btn.type || 'primary'}"
                                data-action="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Mostrar modal usando clases
        container.classList.add('active');
        content.classList.add('visible');
        this.activeModal = content;

        // Configurar eventos
        this.setupModalEvents(config);

        // Callback
        config.onOpen?.();
        window.dispatchEvent(new CustomEvent('i18n-content-changed'));
    }

    private setupModalEvents(config: ModalConfig): void {
        const closeBtn = document.querySelector('[data-action="close-modal"]');
        const overlay = document.getElementById('modal-overlay');
        const buttons = document.querySelectorAll('.modal-footer [data-action]');

        closeBtn?.addEventListener('click', () => this.close());
        overlay?.addEventListener('click', () => this.close());

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (e.target as HTMLElement).dataset.action;
                const buttonConfig = config.buttons?.find(b => b.action === action);

                if (buttonConfig?.closeOnClick !== false) {
                    this.close();
                }
            });
        });
    }

    close(): void {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');

        if (container) container.classList.remove('active');
        if (content) content.classList.remove('visible');

        this.activeModal = null;
    }

    // Modal específico para edición de películas
    openMovieEditor(movieId: number, movieData: any, onSaved?: () => void | Promise<void>): void {
        this.open({
            id: `edit-movie-${movieId}`,
            title: 'Editar Película',
            size: 'large',
            content: this.renderMovieEditor(movieData),
            buttons: [
                { text: 'Guardar', type: 'primary', action: 'save-film', closeOnClick: false },
                { text: 'Cancelar', type: 'secondary', action: 'close-modal' }
            ],
            onOpen: async () => {
                const modalContent = document.getElementById('modal-content');
                const saveBtn = modalContent?.querySelector('[data-action="save-film"]') as HTMLButtonElement | null;
                if (saveBtn) {
                    saveBtn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        await this.handleSaveMovie(movieId, saveBtn, onSaved);
                    });
                }

                // Llenar los selects con datos
                await this.populateFormSelects(movieData);
            }
        });
    }

    /**
     * Llena los selects del formulario de película con datos de la API
     */
    private async populateFormSelects(movieData: any): Promise<void> {
        try {
            // Esperar a que el DOM esté listo (por si el render es asíncrono)
            await new Promise(res => setTimeout(res, 50));
            const editorRoot = this.getEditorRoot();
            if (!editorRoot) {
                console.error('[populateFormSelects] No se encontró #form-editor dentro del modal');
                return;
            }

            // Usar SelectDataManager directamente
            const [countries, genres, subgenres] = await Promise.all([
                this.selectDataManager.getCountries(),
                this.selectDataManager.getGenres(),
                this.selectDataManager.getSubgenres()
            ]);

            // Mapear a formato esperado
            const mappedCountries = (countries || []).map((c: any) => ({
                id: c.id_country || c.id || 0,
                name: c.name || '',
                value: c.code || c.name,
                code: c.code
            }));
            const mappedGenres = (genres || []).map((g: any) => ({
                id: g.id_genre || g.id || 0,
                name: g.name || '',
                value: g.name
            }));
            const mappedSubgenres = (subgenres || []).map((s: any) => ({
                id: s.id_genre || s.id || 0,
                name: s.name || '',
                value: s.name
            }));

            // Verificar existencia de selects antes de rellenar
            const countrySelect = editorRoot.querySelector('select[name="id_country"]');
            const genreSelect = editorRoot.querySelector('select[name="id_genre"]');
            const subgenreSelect = editorRoot.querySelector('select[name="id_subgenre"]');
            if (!countrySelect || !genreSelect || !subgenreSelect) {
                console.error('[populateFormSelects] Uno o más selects no existen en el DOM:', {
                    countrySelect, genreSelect, subgenreSelect
                });
            }

            // Rellenar los selects
            this.populateCountrySelect('id_country', mappedCountries, editorRoot);
            this.populateGenreSelect('id_genre', mappedGenres, editorRoot);
            this.populateGenreSelect('id_subgenre', mappedSubgenres, editorRoot);

            // Establecer valores actuales
            if (movieData?.id_country && countrySelect) {
                (countrySelect as HTMLSelectElement).value = movieData.id_country.toString();
            }
            if (movieData?.id_genre && genreSelect) {
                (genreSelect as HTMLSelectElement).value = movieData.id_genre.toString();
            }
            if (movieData?.id_subgenre && subgenreSelect) {
                (subgenreSelect as HTMLSelectElement).value = movieData.id_subgenre.toString();
            }
        } catch (error) {
            console.error('Error populating form selects:', error);
        }
    }

    /**
     * Rellena un select de país con opciones
     */
    private populateCountrySelect(
        selectName: string,
        options: Array<{ id: number | string; name: string; code?: string; value?: string }>,
        root: ParentNode = document
    ): void {
        const select = root.querySelector(`select[name="${selectName}"]`) as HTMLSelectElement;
        if (!select) return;

        select.innerHTML = [
            '<option value="">Seleccionar país...</option>',
            ...options.map(option => {
                const code = String(option.code || option.value || '').trim();
                const label = `${flagEmoji(code)} ${option.name || code}`.trim();
                return `<option value="${this.escapeHtml(String(option.id))}">${this.escapeHtml(label)}</option>`;
            })
        ].join('');
    }

    /**
     * Rellena un select de género/subgénero con opciones
     */
    private populateGenreSelect(
        selectName: string,
        options: Array<{ id: number | string; name: string; value?: string }>,
        root: ParentNode = document
    ): void {
        const select = root.querySelector(`select[name="${selectName}"]`) as HTMLSelectElement;
        if (!select) return;

        const placeholder = selectName === 'id_subgenre' ? 'Seleccionar subgénero...' : 'Seleccionar género...';
        select.innerHTML = [
            `<option value="">${placeholder}</option>`,
            ...options.map(option => {
                const value = String(option.value || option.name || option.id);
                return `<option value="${this.escapeHtml(String(option.id))}">${this.escapeHtml(value)}</option>`;
            })
        ].join('');
    }

    /**
     * Escapa caracteres HTML en strings
     */
    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }

    private getEditorRoot(): HTMLElement | null {
        const modalContent = document.getElementById('modal-content');
        if (!modalContent) return null;
        return modalContent.querySelector('#form-editor') as HTMLElement | null;
    }

    private async handleSaveMovie(movieId: number, saveBtn: HTMLButtonElement, onSaved?: () => void | Promise<void>): Promise<void> {
        const form = this.getEditorRoot() as HTMLFormElement | null;
        if (!form) return;

        const formData = new FormData(form);
        const payload = this.mapMovieFormPayload(movieId, formData);

        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';

        try {
            const updated = await this.movieService.update(payload);
            if (!updated) {
                this.alertManager.error('No se pudo actualizar la película');
                return;
            }

            this.alertManager.success('Película actualizada');
            if (onSaved) {
                await onSaved();
            }
            this.close();
        } catch (error) {
            this.alertManager.error('Error al guardar los cambios');
            console.error('Error saving movie:', error);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar';
        }
    }

    private mapMovieFormPayload(movieId: number, formData: FormData): Record<string, string | number | null | boolean> {
        const readNumber = (key: string): number | null => {
            const value = String(formData.get(key) || '').trim();
            return value === '' ? null : Number(value);
        };

        const readString = (key: string): string | null => {
            const value = String(formData.get(key) || '').trim();
            return value === '' ? null : value;
        };

        const readBoolean = (key: string): boolean => {
            return formData.get(key) !== null;
        };

        return {
            id_movie: movieId,
            year: readNumber('year'),
            title: readString('title'),
            realtitle: readString('realtitle'),
            quality: readString('quality'),
            extension: readString('extension'),
            size: readNumber('size'),
            size_str: readString('size_str'),
            duration: readNumber('duration'),
            duration_str: readString('duration_str'),
            fps: readNumber('fps'),
            resolution: readString('resolution'),
            hdd_code: readNumber('hdd_code'),
            ratings: readNumber('ratings'),
            pathfile: readString('pathfile'),
            censure: readBoolean('censure'),
            id_country: readNumber('id_country'),
            urldesc: readString('urldesc'),
            urlpicture: readString('urlpicture'),
            id_genre: readNumber('id_genre'),
            id_subgenre: readNumber('id_subgenre')
        };
    }

    private renderMovieEditor(movie: any): string {
        return `
            <form id="form-editor">
                <!-- Fila 1: ID, Año, Calidad -->
                <div class="row">
                    <label>
                        <span>ID</span>
                        <input type="number" name="id_movie" value="${movie.id_movie}" disabled>
                    </label>
                    <label>
                        <span>Año</span>
                        <div class="inp-number">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=year]').stepDown()" value="-">
                            <input type="number" name="year" value="${movie.year || ''}" min="1800" max="2900">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=year]').stepUp()" value="+">
                        </div>
                    </label>
                    <label>
                        <span>Calidad</span>
                        <input type="text" name="quality" value="${movie.quality || ''}" list="dlQuality" placeholder="720p, 1080p...">
                        <datalist id="dlQuality"></datalist>
                    </label>
                </div>

                <!-- Fila 2: Título y Título Original (2 cols) -->
                <div class="row">
                    <label class="full-width">
                        <span>Título</span>
                        <input type="text" name="title" value="${movie.title || ''}">
                    </label>
                    <label class="full-width">
                        <span>Título Original</span>
                        <input type="text" name="realtitle" value="${movie.realtitle || ''}">
                    </label>
                </div>

                <!-- Fila 3: Extensión, Resolución, FPS -->
                <div class="row">
                    <label>
                        <span>Extensión</span>
                        <input type="text" name="extension" maxlength="4" value="${movie.extension || ''}" list="dlExtension">
                        <datalist id="dlExtension"></datalist>
                    </label>
                    <label>
                        <span>Resolución</span>
                        <input type="text" name="resolution" value="${movie.resolution || ''}" list="dlResolution" placeholder="1920x1080">
                        <datalist id="dlResolution"></datalist>
                    </label>
                    <label>
                        <span>FPS</span>
                        <div class="inp-number">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=fps]').stepDown()" value="-">
                            <input type="number" name="fps" value="${movie.fps || ''}" step="0.1" list="dlFps">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=fps]').stepUp()" value="+">
                        </div>
                        <datalist id="dlFps"></datalist>
                    </label>
                </div>

                <!-- Fila 4: Tamaño (bytes), Tamaño Formateado, Duración -->
                <div class="row">
                    <label>
                        <span>Tamaño (bytes)</span>
                        <div class="inp-number">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=size]').stepDown()" value="-">
                            <input type="number" name="size" value="${movie.size || ''}">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=size]').stepUp()" value="+">
                        </div>
                    </label>
                    <label>
                        <span>Tamaño (Formateado)</span>
                        <input type="text" name="size_str" value="${movie.size_str || ''}" disabled placeholder="Automático">
                    </label>
                    <label>
                        <span>Duración (segundos)</span>
                        <div class="inp-number">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=duration]').stepDown()" value="-">
                            <input type="number" name="duration" value="${movie.duration || ''}">
                            <input type="button" onclick="this.parentNode.querySelector('input[name=duration]').stepUp()" value="+">
                        </div>
                    </label>
                </div>

                <!-- Fila 5: Duración Formateado, Rating, HDD -->
                <div class="row">
                    <label>
                        <span>Duración (Formateado)</span>
                        <input type="text" name="duration_str" value="${movie.duration_str || ''}" disabled placeholder="0h 0m 0s">
                    </label>
                    <label>
                        <span>Rating: <span id="rating-value">${movie.ratings || 0}</span>/10</span>
                        <input type="range" name="ratings" min="0" max="10" step="0.5" value="${movie.ratings || 0}"
                               oninput="document.getElementById('rating-value').textContent = this.value">
                    </label>
                    <label>
                        <span>HDD</span>
                        <div class="btn-group" role="group">
                            <input type="radio" class="btn-check" name="hdd_code" id="hdd_0" value="0" ${movie.hdd_code === 0 ? 'checked' : ''}>
                            <label class="btn" for="hdd_0">Interno</label>
                            <input type="radio" class="btn-check" name="hdd_code" id="hdd_1" value="1" ${movie.hdd_code === 1 ? 'checked' : ''}>
                            <label class="btn" for="hdd_1">Externo</label>
                        </div>
                    </label>
                </div>

                <!-- Fila 6: Censurada, País, Género -->
                <div class="row">
                    <label>
                        <span>Censurada</span>
                        <input type="checkbox" name="censure" value="1" ${movie.censure ? 'checked' : ''}>
                    </label>
                    <label>
                        <span>País</span>
                        <select name="id_country">
                            <option value="">Seleccionar país...</option>
                        </select>
                    </label>
                    <label>
                        <span>Género</span>
                        <select name="id_genre">
                            <option value="">Seleccionar género...</option>
                        </select>
                    </label>
                </div>

                <!-- Fila 7: Subgénero y Ruta del Archivo -->
                <div class="row">
                    <label class="full-width">
                        <span>Subgénero</span>
                        <select name="id_subgenre">
                            <option value="">Seleccionar subgénero...</option>
                        </select>
                    </label>
                    <label class="full-width">
                        <span>Ruta del Archivo</span>
                        <input type="text" name="pathfile" value="${movie.pathfile || ''}" placeholder="/ruta/del/archivo">
                    </label>
                </div>

                <!-- Fila 8: URLs -->
                <div class="row">
                    <label class="full-width">
                        <span>URL Descripción</span>
                        <input type="text" name="urldesc" value="${movie.urldesc || ''}" placeholder="/es/film99.html">
                    </label>
				</div>
				<div class="row">
                    <label class="full-width">
                        <span>URL Imagen</span>
                        <input type="text" name="urlpicture" value="${movie.urlpicture || ''}" placeholder="/namefile-mmed.jpg">
                    </label>
                </div>
            </form>
        `;
    }

    // Modal de confirmación
    confirm(message: string, options?: { title?: string; cancelText?: string; confirmText?: string }): Promise<boolean> {
        return new Promise((resolve) => {
            const title = options?.title || 'Confirmación';
            const cancelText = options?.cancelText || 'Cancelar';
            const confirmText = options?.confirmText || 'Aceptar';

            this.open({
                id: 'confirm-modal',
                title,
                content: `<p>${message}</p>`,
                size: 'small',
                buttons: [
                    { text: confirmText, type: 'danger', action: 'confirm-yes', closeOnClick: true },
                    { text: cancelText, type: 'secondary', action: 'confirm-no', closeOnClick: true }
                ],
                onOpen: () => {
                    const yesBtn = document.querySelector('[data-action="confirm-yes"]') as HTMLButtonElement | null;
                    const noBtn = document.querySelector('[data-action="confirm-no"]') as HTMLButtonElement | null;

                    yesBtn?.addEventListener('click', () => {
                        resolve(true);
                    });

                    noBtn?.addEventListener('click', () => {
                        resolve(false);
                    });
                }
            });
        });
    }
}
