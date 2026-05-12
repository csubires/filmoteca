import { BaseService } from './BaseService.js';
export class MovieService extends BaseService {
    async getByGenre(genreId) {
        const url = `/movies_by_genre?id_genre=${genreId}`;
        console.log('getByGenre url:', url);
        const raw = await this.connection.get(url);
        console.log('getByGenre raw:', raw);
        return raw?.data ?? null;
    }
    async getLatest(limit = 50) {
        return this.handleRequest(this.connection.get(`/last_movies?limit=${limit}`), 'Error al obtener últimas películas');
    }
    async search(query) {
        return this.handleRequest(this.connection.get(`/search_movies?search=${encodeURIComponent(query)}&year=${query}&limit=10`), 'Error en la búsqueda');
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
        const response = await this.connection.delete('/delete_movie', this.buildParams({
            id_movie: movieId,
            csrf_token_movie: this.getCsrfToken()
        }));
        return response?.status === 200;
    }
    async updateFromInternet(movieId) {
        const response = await this.handleRequest(this.connection.get(`/update_inet_movie?id_movie=${movieId}`), 'Error al actualizar desde internet');
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
        return this.getSelectOptions('/select_country');
    }
    async getGenres() {
        return this.getSelectOptions('/get_all_genres');
    }
    async getSubgenres() {
        return this.getSelectOptions('/get_all_subgenres');
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
        const response = await this.handleRequest(this.connection.get(endpoint), `Error al obtener opciones de ${endpoint}`);
        if (!response || !Array.isArray(response))
            return null;
        const firstKey = response[0] ? Object.keys(response[0])[0] : 'id';
        const secondKey = response[0] ? Object.keys(response[0])[1] : 'name';
        return response.map(item => ({
            id: item[firstKey],
            name: item[secondKey],
            value: item[secondKey]
        }));
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
