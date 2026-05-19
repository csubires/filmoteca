import { BaseService } from './BaseService.js';
import { SelectDataManager } from './SelectDataManager.js';
import type { ApiResponse } from '../types/api.types.js';
import { Movie, MovieCard, ExtraInfoMovie, Genre, SelectOption } from '../types/api.types.js';

export class MovieService extends BaseService {
    private selectDataManager: SelectDataManager;
    // Cache para opciones de selects (otros, no países/géneros)
    private selectCache: Map<string, SelectOption[]> = new Map();
    private selectCacheTimestamp: Map<string, number> = new Map();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

    constructor() {
        super();
        this.selectDataManager = SelectDataManager.getInstance();
    }

    async getStatsSummary(): Promise<any | null> {
        return this.handleRequest(
            this.connection.get<any>('/stats/summary'),
            'Error al obtener el resumen de estadísticas'
        );
    }

    async getReportsSummary(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/summary'),
            'Error al obtener el listado de reportes'
        );
    }

    async getReportYears(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/years'),
            'Error al obtener estadísticas por año'
        );
    }

    async getReportCountries(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/countries'),
            'Error al obtener estadísticas por país'
        );
    }

    async getReportGenres(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/genres'),
            'Error al obtener estadísticas por género'
        );
    }

    async getReportExtensions(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/extensions'),
            'Error al obtener estadísticas por extensión'
        );
    }

    async getReportRatings(hddCode: number): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>(`/report/ratings/${hddCode}`),
            'Error al obtener estadísticas por valoración'
        );
    }

    async getWorldMapReport(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/world-map'),
            'Error al obtener el mapa mundial'
        );
    }

    async getHddDistribution(): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>('/report/hdd-distribution'),
            'Error al obtener la distribución HDD'
        );
    }

    async advancedSearch(filters: Record<string, string | number | null | undefined>): Promise<MovieCard[] | null> {
        const query = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                query.set(key, String(value));
            }
        });

        return this.handleRequest(
            this.connection.get<MovieCard[]>(`/advanced_search?${query.toString()}`),
            'Error en la búsqueda avanzada'
        );
    }

    // Obtener películas por género
    async getByGenre(genreId: number, page: number = 1, limit?: number): Promise<{ data: MovieCard[], pagination?: any } | null> {
        const offset = (page - 1) * (limit || 20);
        const url = `/movies_by_genre?id_genre=${genreId}&offset=${offset}${limit ? `&limit=${limit}` : ''}`;
        console.log('getByGenre url:', url);
        const response = await this.connection.get<any>(url);
        console.log('getByGenre response:', response);
        return {
            data: response?.data ?? [],
            pagination: (response as any)?.pagination
        };
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
    async search(query: string, limit: number = 10): Promise<MovieCard[] | null> {
        return this.handleRequest(
            this.connection.get<MovieCard[]>(
               `/search_movies?search=${encodeURIComponent(query)}&year=${query}&limit=${limit}`
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
            this.buildParams({ id_movie: movieId })
        );
        return response?.status === 200;
    }

    // Actualizar desde internet
    async updateFromInternet(movieId: number): Promise<Movie | null> {
        const response = await this.handleRequest(
            this.connection.get<Movie[]>(
                '/update_inet_movie',
                { id_movie: movieId }
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
        try {
            const countries = await this.selectDataManager.getCountries();
            if (!countries || countries.length === 0) return null;

            // Mapear a SelectOption
            return countries.map((c: any) => ({
                id: c.id_country || c.id || 0,
                name: c.name || '',
                value: c.code || c.name,
                code: c.code
            }));
        } catch (error) {
            console.error('Error getting countries:', error);
            return null;
        }
    }

    async getGenres(): Promise<SelectOption[] | null> {
        try {
            const genres = await this.selectDataManager.getGenres();
            if (!genres || genres.length === 0) return null;

            // Mapear a SelectOption
            return genres.map((g: any) => ({
                id: g.id_genre || g.id || 0,
                name: g.name || '',
                value: g.name
            }));
        } catch (error) {
            console.error('Error getting genres:', error);
            return null;
        }
    }

    async getSubgenres(): Promise<SelectOption[] | null> {
        try {
            const subgenres = await this.selectDataManager.getSubgenres();
            if (!subgenres || subgenres.length === 0) return null;

            // Mapear a SelectOption
            return subgenres.map((s: any) => ({
                id: s.id_genre || s.id || 0,
                name: s.name || '',
                value: s.name
            }));
        } catch (error) {
            console.error('Error getting subgenres:', error);
            return null;
        }
    }

    /**
     * Obtiene países con datos completos (incluye code, flag, etc)
     */
    async getCountriesRaw(): Promise<any[] | null> {
        try {
            const countries = await this.selectDataManager.getCountries();
            if (!countries || countries.length === 0) return null;

            // Mapear propiedades para compatibilidad con ModalManager
            return countries.map((c: any) => ({
                id: c.id_country || 0,
                name: c.name || '',
                code: c.code || '',
                flag: c.flag
            }));
        } catch (error) {
            console.error('Error getting countries raw:', error);
            return null;
        }
    }

    /**
     * Obtiene géneros con datos completos
     */
    async getGenresRaw(): Promise<any[] | null> {
        try {
            const genres = await this.selectDataManager.getGenres();
            if (!genres || genres.length === 0) return null;

            // Mapear propiedades para compatibilidad con ModalManager
            return genres.map((g: any) => ({
                id: g.id_genre || 0,
                name: g.name || '',
                value: g.name
            }));
        } catch (error) {
            console.error('Error getting genres raw:', error);
            return null;
        }
    }

    /**
     * Obtiene subgéneros con datos completos
     */
    async getSubgenresRaw(): Promise<any[] | null> {
        try {
            const subgenres = await this.selectDataManager.getSubgenres();
            if (!subgenres || subgenres.length === 0) return null;

            // Mapear propiedades para compatibilidad con ModalManager
            return subgenres.map((s: any) => ({
                id: s.id_genre || 0,
                name: s.name || '',
                value: s.name
            }));
        } catch (error) {
            console.error('Error getting subgenres raw:', error);
            return null;
        }
    }

    async getGenreInfo(): Promise<Genre[] | null> {
        return this.handleRequest(
            this.connection.get<Genre[]>('/get_genre_info'),
            'Error al obtener información de géneros'
        );
    }

    async getGenreName(genreId: number): Promise<string | null> {
        const response = await this.handleRequest<any[]>(
            this.connection.get<any[]>(`/get_genre_name/${genreId}`),
            'Error al obtener el nombre del género'
        );

        if (!response || !Array.isArray(response) || response.length === 0) {
            return null;
        }

        return String(response[0]?.name ?? '').trim() || null;
    }

    async getRatings(year: number): Promise<any[] | null> {
        return this.handleRequest(
            this.connection.get<any[]>(`/downloads/rating/${year}`),
            'Error al obtener películas propuestas'
        );
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
    // Verificar si está en cache y no ha expirado
    if (this.selectCache.has(endpoint)) {
        const timestamp = this.selectCacheTimestamp.get(endpoint) || 0;
        if (Date.now() - timestamp < this.CACHE_TTL) {
            return this.selectCache.get(endpoint) || null;
        }
        // Cache expirado, limpiar
        this.selectCache.delete(endpoint);
        this.selectCacheTimestamp.delete(endpoint);
    }

    const response = await this.handleRequest<any[]>(
        this.connection.get<any[]>(endpoint),
        `Error al obtener opciones de ${endpoint}`
    );
    if (!response || !Array.isArray(response)) return null;
    const firstKey = response[0] ? Object.keys(response[0])[0] : 'id';
    const secondKey = response[0] ? Object.keys(response[0])[1] : 'name';
    const options = response.map(item => ({
        id: item[firstKey],
        name: item[secondKey],
        value: item[secondKey]
    }));

    // Guardar en cache
    this.selectCache.set(endpoint, options);
    this.selectCacheTimestamp.set(endpoint, Date.now());

    return options;
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
