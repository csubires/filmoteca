import { AlertManager } from '../components/AlertManager.js';
export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}
export class Connection {
    constructor(baseUrl = '') {
        this.pendingRequests = new Map();
        this.baseUrl = baseUrl;
        this.alertManager = AlertManager.getInstance();
    }
    static getInstance(baseUrl) {
        if (!Connection.instance) {
            Connection.instance = new Connection(baseUrl);
        }
        return Connection.instance;
    }
    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') ?? null;
    }
    async request(method, endpoint, data, options = {}) {
        const { showAlerts = true, timeout = 30000 } = options;
        const url = endpoint.startsWith('http') ? endpoint : this.baseUrl + endpoint;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            const csrfToken = this.getCsrfToken();
            if (csrfToken)
                headers['X-CSRF-Token'] = csrfToken;
            const config = {
                method,
                headers,
                credentials: 'include',
                signal: controller.signal
            };
            if (data) {
                if (data instanceof FormData) {
                    config.body = data;
                    delete headers['Content-Type'];
                }
                else {
                    config.body = JSON.stringify(data);
                }
            }
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            const contentType = response.headers.get('content-type');
            const responseData = contentType?.includes('application/json')
                ? await response.json()
                : { message: await response.text(), data: null, status: response.status };
            if (!response.ok) {
                throw new ApiError(responseData.message || 'Error en la petición', response.status, responseData.data);
            }
            if (showAlerts && responseData.message && method !== 'GET') {
                this.alertManager.success(responseData.message);
            }
            return responseData;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof ApiError)
                throw error;
            const message = error instanceof Error ? error.message : 'Error desconocido';
            const apiError = new ApiError(message, 500);
            if (showAlerts)
                this.alertManager.error(apiError.message);
            throw apiError;
        }
    }
    async get(endpoint, params, options) {
        const allParams = { ...(params || {}), _t: Date.now() };
        const queryString = '?' + new URLSearchParams(Object.fromEntries(Object.entries(allParams).map(([k, v]) => [k, String(v)]))).toString();
        return this.request('GET', endpoint + queryString, undefined, options);
    }
    async post(endpoint, data, options) {
        return this.request('POST', endpoint, data, options);
    }
    async put(endpoint, data, options) {
        return this.request('PUT', endpoint, data, options);
    }
    async delete(endpoint, data, options) {
        return this.request('DELETE', endpoint, data, options);
    }
    cancelAllRequests() {
        this.pendingRequests.forEach(controller => controller.abort());
        this.pendingRequests.clear();
    }
}
export const connection = Connection.getInstance('/api');
