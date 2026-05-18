import { connection } from '../core/connection.js';
export class SelectDataManager {
    constructor() {
        this.CACHE_KEY_COUNTRIES = 'filmoteca_countries';
        this.CACHE_KEY_GENRES = 'filmoteca_genres';
        this.CACHE_KEY_SUBGENRES = 'filmoteca_subgenres';
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
        this.countries = [];
        this.genres = [];
        this.subgenres = [];
        this.loadPromises = new Map();
    }
    static getInstance() {
        if (!SelectDataManager.instance) {
            SelectDataManager.instance = new SelectDataManager();
        }
        return SelectDataManager.instance;
    }
    async getCountries() {
        if (this.countries.length > 0) {
            return this.countries;
        }
        return this.loadFromCacheOrAPI('countries', this.CACHE_KEY_COUNTRIES, () => connection.get('/select_country'));
    }
    async getGenres() {
        if (this.genres.length > 0) {
            return this.genres;
        }
        return this.loadFromCacheOrAPI('genres', this.CACHE_KEY_GENRES, () => connection.get('/get_all_genres'));
    }
    async getSubgenres() {
        if (this.subgenres.length > 0) {
            return this.subgenres;
        }
        return this.loadFromCacheOrAPI('subgenres', this.CACHE_KEY_SUBGENRES, () => connection.get('/get_all_subgenres'));
    }
    async loadFromCacheOrAPI(cacheType, cacheKey, apiCall) {
        if (this.loadPromises.has(cacheType)) {
            return this.loadPromises.get(cacheType);
        }
        const promise = (async () => {
            try {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.setCacheData(cacheType, cached);
                    return cached;
                }
                const response = await apiCall();
                const data = response.data || [];
                this.saveToCache(cacheKey, data);
                this.setCacheData(cacheType, data);
                return data;
            }
            catch (error) {
                console.error(`Error loading ${cacheType}:`, error);
                return [];
            }
            finally {
                this.loadPromises.delete(cacheType);
            }
        })();
        this.loadPromises.set(cacheType, promise);
        return promise;
    }
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached)
                return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error(`Error reading cache for ${key}:`, error);
            return null;
        }
    }
    saveToCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        }
        catch (error) {
            console.error(`Error saving cache for ${key}:`, error);
        }
    }
    setCacheData(cacheType, data) {
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
    async populateCountriesSelect(selectElement) {
        const countries = await this.getCountries();
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id_country.toString();
            option.textContent = country.name;
            selectElement.appendChild(option);
        });
    }
    async populateGenresSelect(selectElement) {
        const genres = await this.getGenres();
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id_genre.toString();
            option.textContent = genre.name;
            selectElement.appendChild(option);
        });
    }
    async populateSubgenresSelect(selectElement) {
        const subgenres = await this.getSubgenres();
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        subgenres.forEach(subgenre => {
            const option = document.createElement('option');
            option.value = subgenre.id_genre.toString();
            option.textContent = subgenre.name;
            selectElement.appendChild(option);
        });
    }
    clearCache() {
        localStorage.removeItem(this.CACHE_KEY_COUNTRIES);
        localStorage.removeItem(this.CACHE_KEY_GENRES);
        localStorage.removeItem(this.CACHE_KEY_SUBGENRES);
        this.countries = [];
        this.genres = [];
        this.subgenres = [];
    }
}
