import { BaseService } from './BaseService.js';
import { SelectDataManager } from './SelectDataManager.js';
export class MovieService extends BaseService {
    constructor() {
        super();
        this.selectCache = new Map();
        this.selectCacheTimestamp = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
        this.selectDataManager = SelectDataManager.getInstance();
    }
    async getStatsSummary() {
        return this.handleRequest(this.connection.get('/stats/summary'), 'Error al obtener el resumen de estadísticas');
    }
    async getReportsSummary() {
        return this.handleRequest(this.connection.get('/report/summary'), 'Error al obtener el listado de reportes');
    }
    async getReportYears() {
        return this.handleRequest(this.connection.get('/report/years'), 'Error al obtener estadísticas por año');
    }
    async getReportCountries() {
        return this.handleRequest(this.connection.get('/report/countries'), 'Error al obtener estadísticas por país');
    }
    async getReportGenres() {
        return this.handleRequest(this.connection.get('/report/genres'), 'Error al obtener estadísticas por género');
    }
    async getReportExtensions() {
        return this.handleRequest(this.connection.get('/report/extensions'), 'Error al obtener estadísticas por extensión');
    }
    async getReportRatings(hddCode) {
        return this.handleRequest(this.connection.get(`/report/ratings/${hddCode}`), 'Error al obtener estadísticas por valoración');
    }
    async getWorldMapReport() {
        return this.handleRequest(this.connection.get('/report/world-map'), 'Error al obtener el mapa mundial');
    }
    async getHddDistribution() {
        return this.handleRequest(this.connection.get('/report/hdd-distribution'), 'Error al obtener la distribución HDD');
    }
    async advancedSearch(filters) {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                query.set(key, String(value));
            }
        });
        return this.handleRequest(this.connection.get(`/advanced_search?${query.toString()}`), 'Error en la búsqueda avanzada');
    }
    async getByGenre(genreId, page = 1, limit) {
        const offset = (page - 1) * (limit || 20);
        const url = `/movies_by_genre?id_genre=${genreId}&offset=${offset}${limit ? `&limit=${limit}` : ''}`;
        console.log('getByGenre url:', url);
        const response = await this.connection.get(url);
        console.log('getByGenre response:', response);
        return {
            data: response?.data ?? [],
            pagination: response?.pagination
        };
    }
    async getLatest(limit = 50) {
        return this.handleRequest(this.connection.get(`/last_movies?limit=${limit}`), 'Error al obtener últimas películas');
    }
    async search(query, limit = 10) {
        return this.handleRequest(this.connection.get(`/search_movies?search=${encodeURIComponent(query)}&year=${query}&limit=${limit}`), 'Error en la búsqueda');
    }
    async getById(movieId) {
        const response = await this.handleRequest(this.connection.get(`/get_movie?id_movie=${movieId}`), 'Error al obtener detalles de la película');
        return response?.[0] || null;
    }
    async getExtraInfo(movieId) {
        const response = await this.handleRequest(this.connection.get(`/extra_info_movie?id_movie=${movieId}`), 'Error al obtener información extra');
        return response?.[0] || null;
    }
    async update(movieData) {
        const response = await this.connection.put('/modify_movie', this.buildParams(movieData));
        return response?.status === 200;
    }
    async delete(movieId) {
        const response = await this.connection.delete('/delete_movie', this.buildParams({ id_movie: movieId }));
        return response?.status === 200;
    }
    async updateFromInternet(movieId) {
        const response = await this.handleRequest(this.connection.get('/update_inet_movie', { id_movie: movieId }), 'Error al actualizar desde internet');
        return response?.[0] || null;
    }
    async getQualities() {
        return this.getSelectOptions('/select_quality');
    }
    async getExtensions() {
        return this.getSelectOptions('/select_extension');
    }
    async getResolutions() {
        return this.getSelectOptions('/select_resolution');
    }
    async getFps() {
        return this.getSelectOptions('/select_fps');
    }
    async getCountries() {
        try {
            const countries = await this.selectDataManager.getCountries();
            if (!countries || countries.length === 0)
                return null;
            return countries.map((c) => ({
                id: c.id_country || c.id || 0,
                name: c.name || '',
                value: c.code || c.name,
                code: c.code
            }));
        }
        catch (error) {
            console.error('Error getting countries:', error);
            return null;
        }
    }
    async getGenres() {
        try {
            const genres = await this.selectDataManager.getGenres();
            if (!genres || genres.length === 0)
                return null;
            return genres.map((g) => ({
                id: g.id_genre || g.id || 0,
                name: g.name || '',
                value: g.name
            }));
        }
        catch (error) {
            console.error('Error getting genres:', error);
            return null;
        }
    }
    async getSubgenres() {
        try {
            const subgenres = await this.selectDataManager.getSubgenres();
            if (!subgenres || subgenres.length === 0)
                return null;
            return subgenres.map((s) => ({
                id: s.id_genre || s.id || 0,
                name: s.name || '',
                value: s.name
            }));
        }
        catch (error) {
            console.error('Error getting subgenres:', error);
            return null;
        }
    }
    async getCountriesRaw() {
        try {
            const countries = await this.selectDataManager.getCountries();
            if (!countries || countries.length === 0)
                return null;
            return countries.map((c) => ({
                id: c.id_country || 0,
                name: c.name || '',
                code: c.code || '',
                flag: c.flag
            }));
        }
        catch (error) {
            console.error('Error getting countries raw:', error);
            return null;
        }
    }
    async getGenresRaw() {
        try {
            const genres = await this.selectDataManager.getGenres();
            if (!genres || genres.length === 0)
                return null;
            return genres.map((g) => ({
                id: g.id_genre || 0,
                name: g.name || '',
                value: g.name
            }));
        }
        catch (error) {
            console.error('Error getting genres raw:', error);
            return null;
        }
    }
    async getSubgenresRaw() {
        try {
            const subgenres = await this.selectDataManager.getSubgenres();
            if (!subgenres || subgenres.length === 0)
                return null;
            return subgenres.map((s) => ({
                id: s.id_genre || 0,
                name: s.name || '',
                value: s.name
            }));
        }
        catch (error) {
            console.error('Error getting subgenres raw:', error);
            return null;
        }
    }
    async getGenreInfo() {
        return this.handleRequest(this.connection.get('/get_genre_info'), 'Error al obtener información de géneros');
    }
    async getGenreName(genreId) {
        const response = await this.handleRequest(this.connection.get(`/get_genre_name/${genreId}`), 'Error al obtener el nombre del género');
        if (!response || !Array.isArray(response) || response.length === 0) {
            return null;
        }
        return String(response[0]?.name ?? '').trim() || null;
    }
    async getRatings(year) {
        return this.handleRequest(this.connection.get(`/downloads/rating/${year}`), 'Error al obtener películas propuestas');
    }
    async getPathGenres() {
        const response = await this.handleRequest(this.connection.get(`/get_all_pathgenres`), 'Error al obtener rutas de géneros');
        if (!response || !Array.isArray(response))
            return null;
        const map = new Map();
        response.forEach(item => {
            map.set(Number(item.id_genre), String(item.pathfolder));
        });
        return map;
    }
    async getSelectOptions(endpoint) {
        if (this.selectCache.has(endpoint)) {
            const timestamp = this.selectCacheTimestamp.get(endpoint) || 0;
            if (Date.now() - timestamp < this.CACHE_TTL) {
                return this.selectCache.get(endpoint) || null;
            }
            this.selectCache.delete(endpoint);
            this.selectCacheTimestamp.delete(endpoint);
        }
        const response = await this.handleRequest(this.connection.get(endpoint), `Error al obtener opciones de ${endpoint}`);
        if (!response || !Array.isArray(response))
            return null;
        const firstKey = response[0] ? Object.keys(response[0])[0] : 'id';
        const secondKey = response[0] ? Object.keys(response[0])[1] : 'name';
        const options = response.map(item => ({
            id: item[firstKey],
            name: item[secondKey],
            value: item[secondKey]
        }));
        this.selectCache.set(endpoint, options);
        this.selectCacheTimestamp.set(endpoint, Date.now());
        return options;
    }
    async autocomplete(query) {
        if (!query || query.length < 2)
            return [];
        const movies = await this.search(query);
        if (!movies)
            return [];
        return [...new Set(movies.map(m => m.title))];
    }
}
