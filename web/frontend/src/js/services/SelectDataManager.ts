import { connection } from '../core/connection.js';

export interface Country {
    id_country: number;
    name: string;
    code: string;
    flag?: string;
}

export interface Genre {
    id_genre: number;
    name: string;
    is_subgenre: number;
}

export class SelectDataManager {
    private static instance: SelectDataManager;
    private readonly CACHE_KEY_COUNTRIES = 'filmoteca_countries';
    private readonly CACHE_KEY_GENRES = 'filmoteca_genres';
    private readonly CACHE_KEY_SUBGENRES = 'filmoteca_subgenres';
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

    private countries: Country[] = [];
    private genres: Genre[] = [];
    private subgenres: Genre[] = [];
    private loadPromises: Map<string, Promise<any>> = new Map();

    private constructor() {}

    static getInstance(): SelectDataManager {
        if (!SelectDataManager.instance) {
            SelectDataManager.instance = new SelectDataManager();
        }
        return SelectDataManager.instance;
    }

    /**
     * Obtiene países del cache o de la API
     */
    async getCountries(): Promise<Country[]> {
        if (this.countries.length > 0) {
            return this.countries;
        }

        return this.loadFromCacheOrAPI('countries', this.CACHE_KEY_COUNTRIES, () =>
            connection.get('/select_country')
        );
    }

    /**
     * Obtiene géneros del cache o de la API
     */
    async getGenres(): Promise<Genre[]> {
        if (this.genres.length > 0) {
            return this.genres;
        }

        return this.loadFromCacheOrAPI('genres', this.CACHE_KEY_GENRES, () =>
            connection.get('/get_all_genres')
        );
    }

    /**
     * Obtiene subgéneros del cache o de la API
     */
    async getSubgenres(): Promise<Genre[]> {
        if (this.subgenres.length > 0) {
            return this.subgenres;
        }

        return this.loadFromCacheOrAPI('subgenres', this.CACHE_KEY_SUBGENRES, () =>
            connection.get('/get_all_subgenres')
        );
    }

    /**
     * Carga datos del cache o de la API, evitando llamadas duplicadas
     */
    private async loadFromCacheOrAPI(
        cacheType: string,
        cacheKey: string,
        apiCall: () => Promise<any>
    ): Promise<any[]> {
        // Si ya hay una promesa en curso, esperar a ella
        if (this.loadPromises.has(cacheType)) {
            return this.loadPromises.get(cacheType)!;
        }

        const promise = (async () => {
            try {
                // Intentar cargar del cache
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.setCacheData(cacheType, cached);
                    return cached;
                }

                // Si no hay cache, hacer la llamada a la API
                const response = await apiCall();
                const data = response.data || [];

                // Guardar en cache
                this.saveToCache(cacheKey, data);
                this.setCacheData(cacheType, data);

                return data;
            } catch (error) {
                console.error(`Error loading ${cacheType}:`, error);
                return [];
            } finally {
                this.loadPromises.delete(cacheType);
            }
        })();

        this.loadPromises.set(cacheType, promise);
        return promise;
    }

    /**
     * Obtiene datos del localStorage
     */
    private getFromCache(key: string): any[] | null {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            // Verificar si el cache ha expirado
            if (Date.now() - timestamp > this.CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }

            return data;
        } catch (error) {
            console.error(`Error reading cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Guarda datos en localStorage
     */
    private saveToCache(key: string, data: any[]): void {
        try {
            localStorage.setItem(
                key,
                JSON.stringify({
                    data,
                    timestamp: Date.now()
                })
            );
        } catch (error) {
            console.error(`Error saving cache for ${key}:`, error);
        }
    }

    /**
     * Actualiza el cache interno en memoria
     */
    private setCacheData(cacheType: string, data: any[]): void {
        switch (cacheType) {
            case 'countries':
                this.countries = data;
                break;
            case 'genres':
                this.genres = data;
                break;
            case 'subgenres':
                this.subgenres = data;
                break;
        }
    }

    /**
     * Rellena un select con datos de países
     */
    async populateCountriesSelect(selectElement: HTMLSelectElement): Promise<void> {
        const countries = await this.getCountries();

        // Limpiar opciones existentes (mantener la primera)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        // Agregar opciones
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id_country.toString();
            option.textContent = country.name;
            selectElement.appendChild(option);
        });
    }

    /**
     * Rellena un select con datos de géneros
     */
    async populateGenresSelect(selectElement: HTMLSelectElement): Promise<void> {
        const genres = await this.getGenres();

        // Limpiar opciones existentes (mantener la primera)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        // Agregar opciones
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id_genre.toString();
            option.textContent = genre.name;
            selectElement.appendChild(option);
        });
    }

    /**
     * Rellena un select con datos de subgéneros
     */
    async populateSubgenresSelect(selectElement: HTMLSelectElement): Promise<void> {
        const subgenres = await this.getSubgenres();

        // Limpiar opciones existentes (mantener la primera)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        // Agregar opciones
        subgenres.forEach(subgenre => {
            const option = document.createElement('option');
            option.value = subgenre.id_genre.toString();
            option.textContent = subgenre.name;
            selectElement.appendChild(option);
        });
    }

    /**
     * Limpia el cache de localStorage
     */
    clearCache(): void {
        localStorage.removeItem(this.CACHE_KEY_COUNTRIES);
        localStorage.removeItem(this.CACHE_KEY_GENRES);
        localStorage.removeItem(this.CACHE_KEY_SUBGENRES);
        this.countries = [];
        this.genres = [];
        this.subgenres = [];
    }
}
