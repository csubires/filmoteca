import { connection } from '../core/connection.js';
import { ModalManager } from './ModalManager.js';
import { AlertManager } from './AlertManager.js';
import { formatBytes, formatDuration, flagEmoji } from '../utils.js';
export interface MovieCardConfig {
    movieId: number;
    title: string;
    year: number;
    duration?: number;
    rating?: number;
    poster?: string;
    genreId?: number;
    genreName?: string;
    showAdmin?: boolean;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}
export class MovieCard {
    private element: HTMLElement;
    private extraInfo: any = null;
    private modalManager: ModalManager;
    private alertManager: AlertManager;
    constructor(private config: MovieCardConfig) {
        this.modalManager = ModalManager.getInstance();
        this.alertManager = AlertManager.getInstance();
        this.element = this.createCard();
        this.attachEvents();
    }
    private createCard(): HTMLElement {
        const card = document.createElement('div');
        card.className = 'card-film';
        card.dataset.movieId = this.config.movieId.toString();
        card.innerHTML = `
            <div class="card-click-film" data-action="show-info" data-id="${this.config.movieId}">
                ${this.config.genreName ?
                    `<div class="popup-genre">${this.config.genreName}</div>` : ''
                }
            </div>
            <div class="card-info-film" id="info-${this.config.movieId}"></div>
            <img src="/covers/${this.config.genreId || '0'}${this.config.poster || 'default.jpg'}"
                 loading="lazy"
                 alt="${this.config.title}">
            <div class="details">
                <strong>${this.config.title}</strong>
                <div>${this.config.rating?.toFixed(1) || 'n/a'}</div>
                <div>${this.config.year}</div>
                <div>${this.config.duration ? formatDuration(this.config.duration) : ''}</div>
            </div>
            ${this.config.showAdmin ? `
                <div class="admin-tools">
                    <button class="btn btn-primary" data-action="edit-movie" data-id="${this.config.movieId}">
                        EDITAR
                    </button>
                    <button class="btn btn-danger-outline" data-action="delete-movie" data-id="${this.config.movieId}">
                        ELIMINAR
                    </button>
                </div>
            ` : ''}
        `;
        return card;
    }
    private attachEvents(): void {
        this.element.querySelector('[data-action="show-info"]')?.addEventListener('click', () => {
            this.toggleInfo();
        });
        this.element.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('btn-close') || target.closest('[data-action="close"]')) {
                this.hideInfo();
            }
        });
        if (this.config.showAdmin) {
            this.element.querySelector('[data-action="edit-movie"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.onEdit?.(this.config.movieId);
            });
            this.element.querySelector('[data-action="delete-movie"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.config.onDelete?.(this.config.movieId);
            });
        }
    }
    private async toggleInfo(): Promise<void> {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        if (!infoDiv) return;
        if (infoDiv.classList.contains('visible')) {
            this.hideInfo();
        } else {
            document.querySelectorAll('.card-info-film.visible').forEach(p => p.classList.remove('visible'));
            await this.loadExtraInfo();
            infoDiv.classList.add('visible');
            window.dispatchEvent(new CustomEvent('card-info-shown', {
                detail: { movieId: this.config.movieId }
            }));
        }
    }
    private hideInfo(): void {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        infoDiv?.classList.remove('visible');
    }
    private async loadExtraInfo(): Promise<void> {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        if (!infoDiv) return;
        if (this.extraInfo) return;
        try {
            const response = await connection.get(`/extra_info_movie`, { id_movie: this.config.movieId });
            this.extraInfo = response.data?.[0];
            if (this.extraInfo) {
                infoDiv.innerHTML = `
                    <strong>${this.extraInfo.realtitle || this.config.title}</strong>
                    <img src="/covers/${this.extraInfo.id_genre_path}${this.extraInfo.urlpicture || ''}" loading="lazy">
                    <a target="_blank" href="https://www.filmaffinity.com${this.extraInfo.urldesc || ''}">
                        <span><i class="icon-file"></i>${this.extraInfo.extension || 'N/A'}</span>
                        <span><i class="icon-film"></i>${this.extraInfo.quality || 'N/A'}</span>
                        <span><i class="icon-hdd"></i>${this.extraInfo.hdd_code === 0 ? 'Interno' : 'Externo'}</span>
                        <span><i class="icon-database"></i>${this.extraInfo.size_str || formatBytes(this.extraInfo.size)}</span>
                    </a>
                    <div class="country">
                        <i>${flagEmoji(this.extraInfo.flag || '')}</i>
                        <span>${this.extraInfo.country || 'Desconocido'}</span>
                    </div>
                    <button type="button" class="btn-close" data-action="close" aria-label="Close"></button>
                `;
            }
        } catch (error) {
            this.alertManager.error('Error al cargar información adicional');
            console.error('Error loading extra info:', error);
        }
    }
    getElement(): HTMLElement {
        return this.element;
    }
    update(config: Partial<MovieCardConfig>): void {
        Object.assign(this.config, config);
        const newElement = this.createCard();
        this.element.replaceWith(newElement);
        this.element = newElement;
        this.attachEvents();
    }
}
