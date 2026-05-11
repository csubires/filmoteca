import { BaseService } from './BaseService.js';
import type { ApiResponse } from '../types/api.types.js';
import { Movie, MovieCard, ExtraInfoMovie, SelectOption } from '../types/api.types.js';

export class MovieService extends BaseService {

    // Obtener películas por género
async getByGenre(genreId: number): Promise<MovieCard[] | null> {
    const url = `/movies_by_genre?id_genre=${genreId}`;
    console.log('getByGenre url:', url);
    const raw = await this.connection.get<MovieCard[]>(url);
    console.log('getByGenre raw:', raw);
    return raw?.data ?? null;
}

    // Obtener últimas películas
    async getLatest(limit: number = 50): Promise<MovieCard[] | null> {
        return this.handleRequest(
            this.connection.get<MovieCard[]>(
                `/last_movies?limit=${limit}`
            ),
            'Error al obtener últimas películas'
        );
    }

    // Búsqueda de películas
    async search(query: string): Promise<MovieCard[] | null> {
        return this.handleRequest(
            this.connection.get<MovieCard[]>(
               `/search_movies?search=${encodeURIComponent(query)}&year=${query}&limit=10`
            ),
            'Error en la búsqueda'
        );
    }

    // Obtener detalles de una película
    async getById(movieId: number): Promise<Movie | null> {
        const response = await this.handleRequest(
            this.connection.get<Movie[]>(
               `/get_movie?id_movie=${movieId}`
            ),
            'Error al obtener detalles de la película'
        );
        return response?.[0] || null;
    }

    // Obtener información extra
    async getExtraInfo(movieId: number): Promise<ExtraInfoMovie | null> {
        const response = await this.handleRequest(
            this.connection.get<ExtraInfoMovie[]>(
                `/extra_info_movie?id_movie=${movieId}`
            ),
            'Error al obtener información extra'
        );
        return response?.[0] || null;
    }

    // Modificar película
    async update(movieData: Partial<Movie>): Promise<boolean> {
        const response = await this.connection.put(
            '/modify_movie',
            this.buildParams(movieData)
        );
        return response?.status === 200;
    }

    // Eliminar película
    async delete(movieId: number): Promise<boolean> {
        const response = await this.connection.delete(
            '/delete_movie',
            this.buildParams({
                id_movie: movieId,
                csrf_token_movie: this.getCsrfToken()
            })
        );
        return response?.status === 200;
    }

    // Actualizar desde internet
    async updateFromInternet(movieId: number): Promise<Movie | null> {
        const response = await this.handleRequest(
            this.connection.get<Movie[]>(
                `/update_inet_movie?id_movie=${movieId}`
            ),
            'Error al actualizar desde internet'
        );
        return response?.[0] || null;
    }

    // Obtener opciones para selects
    async getQualities(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/select_quality');
    }

    async getExtensions(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/select_extension');
    }

    async getResolutions(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/select_resolution');
    }

    async getFps(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/select_fps');
    }

    async getCountries(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/select_country');
    }

    async getGenres(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/get_all_genres');
    }

    async getSubgenres(): Promise<SelectOption[] | null> {
        return this.getSelectOptions('/get_all_subgenres');
    }

async getPathGenres(): Promise<Map<number, string> | null> {
    const response = await this.handleRequest<any[]>(
        this.connection.get<any[]>(`/get_all_pathgenres`),
        'Error al obtener rutas de géneros'
    );
    if (!response || !Array.isArray(response)) return null;
    const map = new Map<number, string>();
    response.forEach(item => {
        map.set(Number(item.id_genre), String(item.pathfolder));
    });
    return map;
}

private async getSelectOptions(endpoint: string): Promise<SelectOption[] | null> {
    const response = await this.handleRequest<any[]>(
        this.connection.get<any[]>(endpoint),
        `Error al obtener opciones de ${endpoint}`
    );
    if (!response || !Array.isArray(response)) return null;
    const firstKey = response[0] ? Object.keys(response[0])[0] : 'id';
    const secondKey = response[0] ? Object.keys(response[0])[1] : 'name';
    return response.map(item => ({
        id: item[firstKey],
        name: item[secondKey],
        value: item[secondKey]
    }));
}

    // Autocompletado para búsqueda
    async autocomplete(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];

        const movies = await this.search(query);
        if (!movies) return [];

        // Devolver títulos únicos
        return [...new Set(movies.map(m => m.title))];
    }
}
