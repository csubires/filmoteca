import { BaseView } from './BaseView.js';
import { MovieService } from '../services/MovieService.js';
export class MaintenanceView extends BaseView {
    constructor() {
        super();
        this.currentMenu = 'general';
        this.movieService = new MovieService();
    }
    async render(params) {
        this.currentMenu = params?.menu || params?.section || 'general';
        const options = [
            { key: 'repeated', name: 'Duplicados', description: 'Películas potencialmente duplicadas' },
            { key: 'deleted-movies', name: 'Borradas', description: 'Películas marcadas como eliminadas' },
            { key: 'uncoded-countries', name: 'Países', description: 'Países sin código' },
            { key: 'incomplete-genres', name: 'Géneros', description: 'Películas con géneros incompletos' },
            { key: 'incomplete', name: 'Incompletas', description: 'Películas sin información completa' },
            { key: 'censored', name: 'Censuradas', description: 'Películas marcadas como censuradas' },
            { key: 'bad-movies', name: 'Deficientes', description: 'Películas de baja calidad' },
            { key: 'missing-hdd0', name: 'Desaparecidas HDD 0', description: 'Películas que faltan en HDD 0 (Interno)' },
            { key: 'missing-hdd1', name: 'Desaparecidas HDD 1', description: 'Películas que faltan en HDD 1 (Externo)' },
            { key: 'low-rated', name: 'Peor valoradas HDD 0', description: 'Películas con baja valoración en HDD 0' },
            { key: 'overevaluated', name: 'Mejor valoradas HDD 1', description: 'Películas con alta valoración en HDD 1' },
            { key: 'corrupt', name: 'Corruptas', description: 'Películas con archivo corrupto' }
        ];
        return `
            <div class="maintenance-container">
                <h1>Mantenimiento</h1>

                <section class="inventories-panel maintenance-panel">
                    <div class="head-result-little">
                        <h3>Opciones de mantenimiento</h3>
                    </div>
                    <div id="maintenance-options" class="inventories-grid maintenance-grid">
                        ${options.map(opt => `
                            <a class="inventory-card maintenance-option ${this.currentMenu === opt.key ? 'active' : ''}"
                               data-descr="${opt.description}"
                               href="/maintenance/${opt.key}">
                                <strong>${opt.name}</strong>
                                <small>${opt.description}</small>
                            </a>
                        `).join('')}
                    </div>
                </section>

                <div id="maintenance-content" class="maintenance-content">
                    ${this.renderCurrentMenu()}
                </div>
            </div>
        `;
    }
    renderCurrentMenu() {
        switch (this.currentMenu) {
            case 'repeated':
                return this.renderRepeatedMenu();
            case 'deleted-movies':
                return this.renderDeletedMoviesMenu();
            case 'missing-hdd0':
                return this.renderMissingHddMenu('HDD 0 (Interno)');
            case 'missing-hdd1':
                return this.renderMissingHddMenu('HDD 1 (Externo)');
            case 'low-rated':
                return this.renderLowRatedMenu();
            case 'overevaluated':
                return this.renderOverevaluatedMenu();
            case 'corrupt':
                return this.renderCorruptMenu();
            case 'uncoded-countries':
                return this.renderCountriesMenu();
            case 'incomplete-genres':
                return this.renderGenresMenu();
            case 'incomplete':
                return this.renderIncompleteMenu();
            case 'censored':
                return this.renderCensoredMenu();
            case 'bad-movies':
                return this.renderBadMoviesMenu();
            default:
                return '<p>Selecciona una opción de mantenimiento</p>';
        }
    }
    renderRepeatedMenu() {
        return `
            <div class="head-result">
                <h3>Películas duplicadas <span id="duplicates-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas potencialmente duplicadas</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID 1</th>
                                <th>Película 1</th>
                                <th>ID 2</th>
                                <th>Película 2</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="duplicates-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderDeletedMoviesMenu() {
        return `
            <div class="head-result">
                <h3>Películas borradas <span id="deleted-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con deleted = 1</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="deleted-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderCountriesMenu() {
        return `
            <div class="head-result">
                <h3>Países sin código <span id="countries-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Países sin código de identificación</h1>
					<a class="btn btn-primary-outline" target="_blank" href="https://country-code.cl/es/">Listado de códigos</a>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Flag</th>
                                <th>Code</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="countries-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderGenresMenu() {
        return `
            <div class="head-result">
                <h3>Géneros incompletos <span id="genres-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con géneros incompletos</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Género</th>
                                <th>Películas</th>
								 <th></th>
                            </tr>
                        </thead>
                        <tbody id="genres-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderIncompleteMenu() {
        return `
            <div class="head-result">
                <h3>Películas incompletas <span id="incomplete-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas sin información completa</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
								<th></th>
                            </tr>
                        </thead>
                        <tbody id="incomplete-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderCensoredMenu() {
        return `
            <div class="head-result">
                <h3>Películas censuradas <span id="censored-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas marcadas como censuradas</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="censored-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderBadMoviesMenu() {
        return `
            <div class="head-result">
                <h3>Películas deficientes <span id="bad-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas de baja calidad o deficientes</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
								<th></th>
                            </tr>
                        </thead>
                        <tbody id="bad-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    async afterRender(params) {
        this.currentMenu = params?.menu || params?.section || 'general';
        switch (this.currentMenu) {
            case 'repeated':
                await this.loadRepeated();
                break;
            case 'deleted-movies':
                await this.loadDeletedMovies();
                break;
            case 'missing-hdd0':
                await this.loadMissingHdd0();
                break;
            case 'missing-hdd1':
                await this.loadMissingHdd1();
                break;
            case 'uncoded-countries':
                await this.loadCountries();
                break;
            case 'incomplete-genres':
                await this.loadGenres();
                break;
            case 'incomplete':
                await this.loadIncomplete();
                break;
            case 'censored':
                await this.loadCensored();
                break;
            case 'low-rated':
                await this.loadLowRated();
                break;
            case 'overevaluated':
                await this.loadOverevaluated();
                break;
            case 'corrupt':
                await this.loadCorrupt();
                break;
            case 'bad-movies':
                await this.loadBadMovies();
                break;
        }
    }
    renderMissingHddMenu(label) {
        return `
            <div class="head-result">
                <h3>Películas desaparecidas <span id="missing-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas que no se encuentran en ${label}</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
								<th></th>
								<th></th>
                            </tr>
                        </thead>
                        <tbody id="missing-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderLowRatedMenu() {
        return `
            <div class="head-result">
                <h3>Películas peor valoradas <span id="lowrated-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con baja valoración (HDD 0)</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
								<th></th>
                            </tr>
                        </thead>
                        <tbody id="lowrated-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderOverevaluatedMenu() {
        return `
            <div class="head-result">
                <h3>Películas mejor valoradas <span id="over-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con alta valoración (HDD 1)</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                                <th>Rating</th>
								<th></th>
                            </tr>
                        </thead>
                        <tbody id="over-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    renderCorruptMenu() {
        return `
            <div class="head-result">
                <h3>Películas corruptas <span id="corrupt-count">0</span></h3>
            </div>
            <main class="table">
                <section class="table__header">
                    <h1>Películas con archivo corrupto</h1>
                </section>
                <section class="table__body">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Año</th>
                            </tr>
                        </thead>
                        <tbody id="corrupt-table-body"></tbody>
                    </table>
                </section>
            </main>
        `;
    }
    async loadMissingHdd0() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/missing-hdd0');
            const movies = response.data || [];
            const tbody = document.getElementById('missing-table-body');
            const countSpan = document.getElementById('missing-count');
            if (!tbody || !movies)
                return;
            if (countSpan)
                countSpan.textContent = String(movies.length);
            tbody.innerHTML = movies.map((m) => `
                <tr>
                    <td>${m.id_movie}</td>
                    <td>${this.escapeHtml(m.title)}</td>
                    <td>${m.year}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${m.id_movie}">EDITAR</button>
                        <button type="button" class="btn btn-danger-outline" data-action="delete-movie" data-id="${m.id_movie}">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadMissingHdd0();
                    });
                });
            });
            tbody.querySelectorAll('[data-action="delete-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    const confirmed = await this.modalManager.confirm('¿Eliminar esta película?', { title: 'Confirmación', confirmText: 'Eliminar', cancelText: 'Cancelar' });
                    if (!confirmed)
                        return;
                    try {
                        const res = await this.movieService['connection'].delete('/delete_movie', { id_movie: id }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Película eliminada');
                            await this.loadMissingHdd0();
                        }
                        else {
                            this.alertManager.error('No se pudo eliminar la película');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al eliminar película');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas desaparecidas (HDD 0)');
        }
    }
    async loadMissingHdd1() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/missing-hdd1');
            const movies = response.data || [];
            const tbody = document.getElementById('missing-table-body');
            const countSpan = document.getElementById('missing-count');
            if (!tbody || !movies)
                return;
            if (countSpan)
                countSpan.textContent = String(movies.length);
            tbody.innerHTML = movies.map((m) => `
                <tr>
                    <td>${m.id_movie}</td>
                    <td>${this.escapeHtml(m.title)}</td>
                    <td>${m.year}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${m.id_movie}">EDITAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadMissingHdd1();
                    });
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas desaparecidas (HDD 1)');
        }
    }
    async loadLowRated() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/low-rated');
            const movies = response.data || [];
            const tbody = document.getElementById('lowrated-table-body');
            const countSpan = document.getElementById('lowrated-count');
            if (!tbody || !movies)
                return;
            if (countSpan)
                countSpan.textContent = String(movies.length);
            tbody.innerHTML = movies.map((m) => `
                <tr>
                    <td>${m.id_movie}</td>
                    <td>${this.escapeHtml(m.title)}</td>
                    <td>${m.year}</td>
                    <td>${m.ratings ?? 'N/A'}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${m.id_movie}">EDITAR</button>
                    </td>
                </tr>
            `).join('');
            const lowCount = document.getElementById('lowrated-count');
            if (lowCount && !document.getElementById('copy-lowrated')) {
                lowCount.insertAdjacentHTML('afterend', ' <button id="copy-lowrated" class="btn btn-primary-outline">Copiar lista</button>');
                document.getElementById('copy-lowrated')?.addEventListener('click', async () => {
                    const text = movies.map((m) => `${m.id_movie}\t${m.title}\t${m.year}\t${m.ratings ?? ''}`).join('\n');
                    try {
                        await navigator.clipboard.writeText(text);
                        this.alertManager.success('Listado copiado al portapapeles');
                    }
                    catch (e) {
                        this.alertManager.error('No se pudo copiar al portapapeles');
                    }
                });
            }
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadLowRated();
                    });
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas peor valoradas');
        }
    }
    async loadOverevaluated() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/overevaluated');
            const movies = response.data || [];
            const tbody = document.getElementById('over-table-body');
            const countSpan = document.getElementById('over-count');
            if (!tbody || !movies)
                return;
            if (countSpan)
                countSpan.textContent = String(movies.length);
            tbody.innerHTML = movies.map((m) => `
                <tr>
                    <td>${m.id_movie}</td>
                    <td>${this.escapeHtml(m.title)}</td>
                    <td>${m.year}</td>
                    <td>${m.ratings ?? 'N/A'}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${m.id_movie}">EDITAR</button>
                    </td>
                </tr>
            `).join('');
            const overCount = document.getElementById('over-count');
            if (overCount && !document.getElementById('copy-over')) {
                overCount.insertAdjacentHTML('afterend', ' <button id="copy-over" class="btn btn-primary-outline">Copiar lista</button>');
                document.getElementById('copy-over')?.addEventListener('click', async () => {
                    const text = movies.map((m) => `${m.id_movie}\t${m.title}\t${m.year}\t${m.ratings ?? ''}`).join('\n');
                    try {
                        await navigator.clipboard.writeText(text);
                        this.alertManager.success('Listado copiado al portapapeles');
                    }
                    catch (e) {
                        this.alertManager.error('No se pudo copiar al portapapeles');
                    }
                });
            }
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadOverevaluated();
                    });
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas mejor valoradas');
        }
    }
    async loadCorrupt() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/corrupt');
            const movies = response.data || [];
            const tbody = document.getElementById('corrupt-table-body');
            const countSpan = document.getElementById('corrupt-count');
            if (!tbody || !movies)
                return;
            if (countSpan)
                countSpan.textContent = String(movies.length);
            tbody.innerHTML = movies.map((m) => `
                <tr>
                    <td>${m.id_movie}</td>
                    <td>${this.escapeHtml(m.title)}</td>
                    <td>${m.year}</td>
                    <td>
                        <button type="button" class="btn btn-danger-outline" data-action="delete-movie" data-id="${m.id_movie}">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="delete-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    const confirmed = await this.modalManager.confirm('¿Eliminar esta película?', { title: 'Confirmación', confirmText: 'Eliminar', cancelText: 'Cancelar' });
                    if (!confirmed)
                        return;
                    try {
                        const res = await this.movieService['connection'].delete('/delete_movie', { id_movie: id }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Película eliminada');
                            await this.loadCorrupt();
                        }
                        else {
                            this.alertManager.error('No se pudo eliminar la película');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al eliminar película');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas corruptas');
        }
    }
    async loadRepeated() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/repeated');
            const movies = response.data || [];
            const tbody = document.getElementById('duplicates-table-body');
            const countSpan = document.getElementById('duplicates-count');
            if (!tbody || !movies)
                return;
            const groups = {};
            movies.forEach((m) => {
                const title = String(m.title || m.title2 || '').trim() || 'Unknown';
                groups[title] = groups[title] || [];
                groups[title].push(m);
            });
            const pairs = Object.values(groups).filter(g => g.length > 1);
            if (countSpan)
                countSpan.textContent = String(pairs.length);
            tbody.innerHTML = pairs.map(group => {
                const left = group[0] || {};
                const right = group[1] || {};
                const leftPoster = left.urlpicture ? `<img src="\/posters/${left.id_genre || ''}${left.urlpicture}" alt="${this.escapeHtml(left.title || '')}" class="thumb-small">` : '';
                const rightPoster = right.urlpicture ? `<img src="\/posters/${right.id_genre || ''}${right.urlpicture}" alt="${this.escapeHtml(right.title || '')}" class="thumb-small">` : '';
                return `
                <tr>
                    <td class="dup-poster">${leftPoster}<div>${this.escapeHtml(left.title || '')}<br><small>ID ${left.id_movie || ''}</small><br><small>Genre ${left.id_genre || ''}</small></div></td>
                    <td class="dup-actions"><button type="button" class="btn btn-danger-outline" data-action="delete-movie" data-id="${left.id_movie || ''}">ELIMINAR</button></td>
                    <td>${this.escapeHtml(left.year || '')}</td>
					<td class="dup-poster">${rightPoster}<div>${this.escapeHtml(right.title || '')}<br><small>ID ${right.id_movie || ''}</small><br><small>Genre ${right.id_genre || ''}</small></div></td>
                    <td class="dup-actions"><button type="button" class="btn btn-danger-outline" data-action="delete-movie" data-id="${right.id_movie || ''}">ELIMINAR</button></td>
                    <td>${this.escapeHtml(right.year || '')}</td>
                </tr>
            `;
            }).join('');
            tbody.querySelectorAll('[data-action="delete-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    if (!Number.isInteger(id) || id <= 0)
                        return;
                    const confirmed = await this.modalManager.confirm('¿Eliminar esta película (marcar como borrada)?', { title: 'Confirmación', confirmText: 'Eliminar', cancelText: 'Cancelar' });
                    if (!confirmed)
                        return;
                    try {
                        const res = await this.movieService['connection'].delete('/delete_movie', { id_movie: id }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Película eliminada');
                            await this.loadRepeated();
                        }
                        else {
                            this.alertManager.error('No se pudo eliminar la película');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al eliminar película');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar duplicados');
        }
    }
    async loadDeletedMovies() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/deleted-movies');
            const movies = response.data || [];
            const tbody = document.getElementById('deleted-table-body');
            const countSpan = document.getElementById('deleted-count');
            if (!tbody || !movies)
                return;
            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }
            tbody.innerHTML = movies.map((movie) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${this.escapeHtml(movie.title)}</td>
                    <td>${movie.year ?? 'N/A'}</td>
                    <td>${movie.ratings ?? 'N/A'}</td>
                    <td>
                        <button type="button" class="btn btn-primary-outline" data-action="restore-movie" data-id="${movie.id_movie}">Restaurar</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="restore-movie"]').forEach(button => {
                button.addEventListener('click', async () => {
                    const movieId = Number(button.dataset.id);
                    if (!Number.isInteger(movieId) || movieId <= 0)
                        return;
                    try {
                        const result = await this.movieService['connection'].put('/restore_movie', { id_movie: movieId }, { showAlerts: false });
                        if (result?.status !== 200) {
                            this.alertManager.error('No se pudo restaurar la película');
                            return;
                        }
                        this.alertManager.success('Película restaurada correctamente');
                        await this.loadDeletedMovies();
                    }
                    catch (restoreError) {
                        this.handleError(restoreError, 'Error al restaurar película');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas borradas');
        }
    }
    async loadCountries() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/uncoded-countries');
            const movies = response.data || [];
            const tbody = document.getElementById('countries-table-body');
            const countSpan = document.getElementById('countries-count');
            if (!tbody || !movies)
                return;
            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }
            tbody.innerHTML = movies.map((c) => `
                <tr>
                    <td>${c.id_country}</td>
                    <td>${this.escapeHtml(c.name || '')}</td>
                    <td><input type="text" class="country-code-input" data-id="${c.id_country}" value="${this.escapeHtml(c.code || '')}" /></td>
                    <td><button class="btn btn-primary-outline save-country" data-id="${c.id_country}">Guardar</button></td>
                </tr>
            `).join('');
            tbody.querySelectorAll('.save-country').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    const input = tbody.querySelector(`.country-code-input[data-id="${id}"]`);
                    const code = input?.value?.trim() || '';
                    try {
                        const res = await this.movieService['connection'].put('/update_country', { id_country: id, code, flag: null }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Código de país actualizado');
                            await this.loadCountries();
                        }
                        else {
                            this.alertManager.error('No se pudo actualizar el país');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al actualizar código de país');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar Países');
        }
    }
    async loadGenres() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/incomplete-genres');
            const genres = response.data || [];
            const tbody = document.getElementById('genres-table-body');
            const countSpan = document.getElementById('genres-count');
            if (!tbody || !genres)
                return;
            if (countSpan) {
                countSpan.textContent = genres.length.toString();
            }
            tbody.innerHTML = genres.map((genre) => `
                <tr>
                    <td>${genre.id_genre}</td>
                    <td>${this.escapeHtml(genre.name || '')}</td>
                    <td>${genre.count || 0}</td>
                    <td>
                        <button type="button" class="btn btn-danger-outline" data-action="delete-genre" data-id="${genre.id_genre}">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="delete-genre"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    const confirmed = await this.modalManager.confirm('¿Eliminar este género?', { title: 'Confirmación', confirmText: 'Eliminar', cancelText: 'Cancelar' });
                    if (!confirmed)
                        return;
                    try {
                        const res = await this.movieService['connection'].delete('/delete_genre', { id_genre: id }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Género eliminado');
                            await this.loadGenres();
                        }
                        else {
                            this.alertManager.error('No se pudo eliminar el género');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al eliminar género');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar géneros');
        }
    }
    async loadIncomplete() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/incomplete');
            const movies = response.data || [];
            const tbody = document.getElementById('incomplete-table-body');
            const countSpan = document.getElementById('incomplete-count');
            if (!tbody || !movies)
                return;
            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }
            tbody.innerHTML = movies.map((movie) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${this.escapeHtml(movie.title)}</td>
                    <td>${movie.year}</td>
                    <td>${movie.rating || 'N/A'}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${movie.id_movie}">EDITAR</button>
                        <button type="button" class="btn btn-danger-outline" data-action="delete-movie" data-id="${movie.id_movie}">ELIMINAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadIncomplete();
                    });
                });
            });
            tbody.querySelectorAll('[data-action="delete-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    const confirmed = await this.modalManager.confirm('¿Eliminar esta película?', { title: 'Confirmación', confirmText: 'Eliminar', cancelText: 'Cancelar' });
                    if (!confirmed)
                        return;
                    try {
                        const res = await this.movieService['connection'].delete('/delete_movie', { id_movie: id }, { showAlerts: false });
                        if (res?.status === 200) {
                            this.alertManager.success('Película eliminada');
                            await this.loadIncomplete();
                        }
                        else {
                            this.alertManager.error('No se pudo eliminar la película');
                        }
                    }
                    catch (e) {
                        this.handleError(e, 'Error al eliminar película');
                    }
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas incompletas');
        }
    }
    async loadCensored() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/censored');
            const movies = response.data || [];
            const tbody = document.getElementById('censored-table-body');
            const countSpan = document.getElementById('censored-count');
            if (!tbody || !movies)
                return;
            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }
            tbody.innerHTML = movies.map((movie) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${movie.title}</td>
                    <td>${movie.year}</td>
                </tr>
            `).join('');
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas censuradas');
        }
    }
    async loadBadMovies() {
        try {
            const response = await this.movieService['connection'].get('/maintenance/bad-movies');
            const movies = response.data || [];
            const tbody = document.getElementById('bad-table-body');
            const countSpan = document.getElementById('bad-count');
            if (!tbody || !movies)
                return;
            if (countSpan) {
                countSpan.textContent = movies.length.toString();
            }
            tbody.innerHTML = movies.map((movie) => `
                <tr>
                    <td>${movie.id_movie}</td>
                    <td>${this.escapeHtml(movie.title)}</td>
                    <td>${movie.year}</td>
                    <td>${movie.rating || 'N/A'}</td>
                    <td>
                        <button type="button" class="btn btn-primary" data-action="edit-movie" data-id="${movie.id_movie}">EDITAR</button>
                    </td>
                </tr>
            `).join('');
            tbody.querySelectorAll('[data-action="edit-movie"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = Number(btn.dataset.id);
                    await this.openUnifiedMovieEditor(id, async () => {
                        await this.loadBadMovies();
                    });
                });
            });
        }
        catch (error) {
            this.handleError(error, 'Error al cargar películas deficientes');
        }
    }
    cleanup() {
    }
    async openUnifiedMovieEditor(movieId, onSaved) {
        if (!Number.isInteger(movieId) || movieId <= 0)
            return;
        try {
            const movie = await this.movieService.getById(movieId);
            if (!movie) {
                this.alertManager.error('No se pudieron cargar los datos completos de la película');
                return;
            }
            this.modalManager.openMovieEditor(movieId, movie, onSaved);
        }
        catch (error) {
            this.handleError(error, 'Error al abrir editor de película');
        }
    }
    escapeHtml(value) {
        if (value === null || value === undefined)
            return '';
        return String(value).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s]));
    }
}
export default MaintenanceView;
