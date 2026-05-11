import { Renderer } from '../core/renderer.js';
import { getCsrfToken } from '../utils.js';

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

    private constructor() {
        this.renderer = Renderer.getInstance();
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
            <div id="modal-overlay" class="modal-overlay" style="display: none;"></div>
            <div id="modal-content" class="modal-content" style="display: none;"></div>
        `;
        document.body.appendChild(container);
    }

    open(config: ModalConfig): void {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        if (!overlay || !content) return;

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

        // Mostrar modal
        overlay.style.display = 'block';
        content.style.display = 'block';
        this.activeModal = content;

        // Configurar eventos
        this.setupModalEvents(config);

        // Callback
        config.onOpen?.();
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
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        if (overlay) overlay.style.display = 'none';
        if (content) content.style.display = 'none';

        this.activeModal = null;
    }

    // Modal específico para edición de películas
    openMovieEditor(movieId: number, movieData: any, csrfToken: string): void {
        this.open({
            id: `edit-movie-${movieId}`,
            title: 'Editar Película',
            size: 'large',
            content: this.renderMovieEditor(movieData, csrfToken),
            buttons: [
                { text: 'Guardar', type: 'primary', action: 'save-film' },
                { text: 'Cancelar', type: 'secondary', action: 'close-modal' }
            ]
        });
    }

    private renderMovieEditor(movie: any, csrfToken: string): string {
        return `
            <form id="form-editor" method="dialog">
                <input type="hidden" name="csrf_token_form" value="${csrfToken}">

                <div class="row">
                    <label>
                        <span>ID</span>
                        <input type="number" name="id_movie" value="${movie.id_movie}" disabled>
                    </label>
                    <label>
                        <span>Año</span>
                        <input type="number" name="year" value="${movie.year || ''}" min="1800" max="2900">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>Título</span>
                        <input type="text" name="title" value="${movie.title || ''}">
                    </label>
                    <label>
                        <span>Título original</span>
                        <input type="text" name="realtitle" value="${movie.realtitle || ''}">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>Calidad</span>
                        <input type="text" name="quality" value="${movie.quality || ''}" list="dlQuality">
                    </label>
                    <label>
                        <span>Extensión</span>
                        <input type="text" name="extension" value="${movie.extension || ''}" list="dlExtension">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>Tamaño (bytes)</span>
                        <input type="number" name="size" value="${movie.size || ''}">
                    </label>
                    <label>
                        <span>Duración (seg)</span>
                        <input type="number" name="duration" value="${movie.duration || ''}">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>HDD</span>
                        <select name="hdd_code">
                            <option value="0" ${movie.hdd_code === 0 ? 'selected' : ''}>Interno</option>
                            <option value="1" ${movie.hdd_code === 1 ? 'selected' : ''}>Externo</option>
                        </select>
                    </label>
                    <label>
                        <span>Rating</span>
                        <input type="range" name="ratings" min="0" max="10" step="0.5" value="${movie.ratings || 0}">
                    </label>
                </div>
            </form>
        `;
    }
}
