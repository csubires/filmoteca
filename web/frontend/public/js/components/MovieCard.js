import { connection } from '../core/connection.js';
import { MovieService } from '../services/MovieService.js';
import { ModalManager } from './ModalManager.js';
import { AlertManager } from './AlertManager.js';
import { formatBytes, formatDuration, flagEmoji } from '../utils.js';
import { auth } from '../main.js';
export class MovieCard {
    constructor(config) {
        this.config = config;
        this.extraInfo = null;
        this.modalManager = ModalManager.getInstance();
        this.alertManager = AlertManager.getInstance();
        this.movieService = new MovieService();
        this.element = this.createCard();
        this.attachEvents();
    }
    createCard() {
        const card = document.createElement('div');
        card.className = 'card-film';
        card.dataset.movieId = this.config.movieId.toString();
        card.innerHTML = `
            <div class="card-click-film" data-action="show-info" data-id="${this.config.movieId}">
                ${this.config.genreName ? `<div class="popup-genre">${this.config.genreName}</div>` : ''}
            </div>
            <div class="card-info-film" id="info-${this.config.movieId}" aria-hidden="true" role="dialog" aria-modal="true"></div>
            <img src="${(this.config.genreId === 0 || !this.config.poster)
            ? '/assets/default_poster.jpg'
            : `/posters/${this.config.genreId || '0'}${this.config.poster}`}"
                 loading="lazy"
                 alt="${this.config.title}">
            <div class="details">
                <strong>${this.config.title}</strong>
                <div>${this.config.rating?.toFixed(1) || 'n/a'}</div>
                <div>${this.config.year}</div>
                <div>${this.config.duration ? formatDuration(this.config.duration) : ''}</div>
            </div>
        `;
        return card;
    }
    attachEvents() {
        this.element.querySelector('[data-action="show-info"]')?.addEventListener('click', (event) => {
            event.preventDefault();
            this.toggleInfo(event);
        });
        this.element.addEventListener('click', (event) => {
            const target = event.target;
            if (target.closest('[data-action="close"]') || target.classList.contains('btn-close')) {
                this.hideInfo();
            }
        });
        const infoDiv = this.element.querySelector(`#info-${this.config.movieId}`);
        infoDiv?.addEventListener('click', (event) => {
            if (event.target === infoDiv) {
                this.hideInfo();
            }
        });
    }
    async toggleInfo(event) {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        if (!infoDiv)
            return;
        if (infoDiv.classList.contains('visible')) {
            this.hideInfo();
            return;
        }
        document.querySelectorAll('.card-info-film.visible').forEach(panel => {
            panel.classList.remove('visible');
            panel.setAttribute('aria-hidden', 'true');
        });
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer && infoDiv.parentElement !== modalContainer) {
            modalContainer.appendChild(infoDiv);
        }
        await this.loadExtraInfo();
        infoDiv.classList.add('visible');
        infoDiv.setAttribute('aria-hidden', 'false');
        document.body.classList.add('movie-overlay-open');
        document.dispatchEvent(new CustomEvent('card-info-shown', {
            detail: {
                movieId: this.config.movieId,
                x: event?.clientX,
                y: event?.clientY
            }
        }));
    }
    hideInfo() {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        if (!infoDiv)
            return;
        infoDiv.classList.remove('visible');
        infoDiv.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.card-info-film.visible')) {
            document.body.classList.remove('movie-overlay-open');
        }
    }
    async loadExtraInfo() {
        const infoDiv = document.getElementById(`info-${this.config.movieId}`);
        if (!infoDiv)
            return;
        try {
            const response = await connection.get('/extra_info_movie', { id_movie: this.config.movieId });
            this.extraInfo = (response.data?.[0] || null);
            this.renderInfoPanel(infoDiv);
        }
        catch (error) {
            this.alertManager.error('Error al cargar información adicional');
            console.error('Error loading extra info:', error);
            this.extraInfo = null;
            this.renderInfoPanel(infoDiv);
        }
    }
    renderInfoPanel(infoDiv) {
        const movie = this.normalizeExtraInfo(this.extraInfo);
        const showAdmin = Boolean(this.config.showAdmin || auth.isAuthenticated());
        const genrePath = Number(movie.id_genre_path ?? movie.id_genre ?? this.config.genreId ?? 0);
        const posterSrc = movie?.urlpicture
            ? `/posters/${genrePath}${movie.urlpicture}`
            : (this.config.poster ? `/posters/${genrePath}${this.config.poster}` : '/assets/default_poster.jpg');
        const countryName = String(movie.country || movie.name || '').trim() || 'Desconocido';
        const flagIcon = this.resolveCountryFlag(movie);
        const movieTitle = movie?.realtitle || this.config.title;
        const hddLabel = Number(movie?.hdd_code ?? 0) === 0 ? 'Interno' : 'Externo';
        const sizeText = movie?.size_str || (movie?.size !== undefined && movie?.size !== null ? formatBytes(Number(movie.size)) : 'N/A');
        const detailsUrl = movie?.urldesc ? `https://www.filmaffinity.com${movie.urldesc}` : 'https://www.filmaffinity.com';
        infoDiv.innerHTML = `
            <div class="movie-info-dialog">
                <div class="movie-info-header">
                    <strong>${movieTitle}</strong>
                    <button type="button" class="btn-close" data-action="close" aria-label="Cerrar">×</button>
                </div>
                <div class="movie-info-body">
                    <img class="movie-info-poster" src="${posterSrc}" loading="lazy" alt="${movieTitle}">
                    <div class="movie-info-content">
                        <div class="movie-info-meta">
                            <span><i class="icon-file"></i>${movie?.extension || 'N/A'}</span>
                            <span><i class="icon-film"></i>${movie?.quality || 'N/A'}</span>
                            <span><i class="icon-hdd"></i>${hddLabel}</span>
                            <span><i class="icon-database"></i>${sizeText}</span>
                        </div>
                        <a class="movie-info-link" target="_blank" rel="noopener noreferrer" href="${detailsUrl}">Abrir ficha externa</a>
                        <div class="country">
                            <i>${flagIcon}</i>
                            <span>${countryName}</span>
                        </div>
                        ${showAdmin ? `
                            <div class="admin-tools movie-info-actions">
                                <button type="button" class="btn btn-warning-outline" data-action="update-internet">ACTUALIZAR</button>
                                <button type="button" class="btn btn-primary" data-action="edit-movie">EDITAR</button>
                                <button type="button" class="btn btn-danger-outline" data-action="delete-movie">ELIMINAR</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        infoDiv.querySelector('.btn-close')?.addEventListener('click', (event) => {
            event.stopPropagation();
            this.hideInfo();
        });
        if (showAdmin) {
            infoDiv.querySelector('[data-action="update-internet"]')?.addEventListener('click', async (event) => {
                event.stopPropagation();
                await this.handleUpdateFromInternet();
            });
            infoDiv.querySelector('[data-action="edit-movie"]')?.addEventListener('click', async (event) => {
                event.stopPropagation();
                await this.handleEdit();
            });
            infoDiv.querySelector('[data-action="delete-movie"]')?.addEventListener('click', async (event) => {
                event.stopPropagation();
                await this.handleDelete();
            });
        }
    }
    async handleEdit() {
        if (this.config.onEdit) {
            this.config.onEdit(this.config.movieId);
            return;
        }
        try {
            const movie = await this.movieService.getById(this.config.movieId);
            if (!movie) {
                this.alertManager.error('No se pudieron cargar los datos de la película');
                return;
            }
            this.modalManager.openMovieEditor(this.config.movieId, movie, async () => {
                this.hideInfo();
                await this.loadExtraInfo();
            });
        }
        catch (error) {
            this.alertManager.error('Error al abrir el editor');
            console.error('Error opening movie editor:', error);
        }
    }
    async handleUpdateFromInternet() {
        try {
            const updatedMovie = await this.movieService.updateFromInternet(this.config.movieId);
            if (!updatedMovie) {
                this.alertManager.error('No se pudo actualizar la película');
                return;
            }
            this.extraInfo = null;
            await this.loadExtraInfo();
            this.alertManager.success('Película actualizada desde internet');
        }
        catch (error) {
            this.alertManager.error('Error al actualizar la película');
            console.error('Error updating movie from internet:', error);
        }
    }
    async handleDelete() {
        if (this.config.onDelete) {
            this.config.onDelete(this.config.movieId);
            return;
        }
        const confirmed = await this.modalManager.confirm('¿Estás seguro de eliminar esta película?', {
            title: 'Eliminar película',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
        if (!confirmed)
            return;
        try {
            const deleted = await this.movieService.delete(this.config.movieId);
            if (!deleted) {
                this.alertManager.error('No se pudo eliminar la película');
                return;
            }
            this.element.remove();
            this.hideInfo();
            this.alertManager.success('Película eliminada');
        }
        catch (error) {
            this.alertManager.error('Error al eliminar la película');
            console.error('Error deleting movie:', error);
        }
    }
    getElement() {
        return this.element;
    }
    normalizeExtraInfo(movie) {
        return {
            ...(movie || {}),
            country: String(movie?.country || movie?.name || '').trim()
        };
    }
    resolveCountryFlag(movie) {
        const rawFlag = String(movie?.flag || '').trim();
        if (rawFlag && !/^[a-z]{2}$/i.test(rawFlag)) {
            return rawFlag;
        }
        const code = String(movie?.code || rawFlag || '').trim().toLowerCase();
        if (code) {
            return flagEmoji(code);
        }
        return '🏳️';
    }
    update(config) {
        Object.assign(this.config, config);
        document.getElementById(`info-${this.config.movieId}`)?.remove();
        const newElement = this.createCard();
        this.element.replaceWith(newElement);
        this.element = newElement;
        this.attachEvents();
    }
}
