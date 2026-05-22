import { AlertManager } from '../components/AlertManager.js';
import { ApiResponse } from '../types/api.types.js';
import { getHeaders } from '../api.js';


export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class Connection {
    private static instance: Connection;
    private baseUrl: string;
    private alertManager: AlertManager;
    private pendingRequests: Map<string, AbortController> = new Map();

    private constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
        this.alertManager = AlertManager.getInstance();
    }

    static getInstance(baseUrl?: string): Connection {
        if (!Connection.instance) {
            Connection.instance = new Connection(baseUrl);
        }
        return Connection.instance;
    }

private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: {
        showAlerts?: boolean;
        timeout?: number;
        signal?: AbortSignal;
    } = {}
): Promise<ApiResponse<T>> {
    const { showAlerts = true, timeout = 30000 } = options;
    const url = endpoint.startsWith('http') ? endpoint : this.baseUrl + endpoint;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...getHeaders()
        };

        const config: RequestInit = {
            method,
            headers,
            signal: controller.signal
        };

        if (data) {
            if (data instanceof FormData) {
                config.body = data;
                delete headers['Content-Type'];
            } else {
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
            throw new ApiError(
                responseData.message || 'Error en la petición',
                response.status,
                responseData.data
            );
        }

        if (showAlerts && responseData.message && method !== 'GET') {
            this.alertManager.success(responseData.message);
        }

        return responseData;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof ApiError) throw error;
        const message = error instanceof Error ? error.message : 'Error desconocido';
        const apiError = new ApiError(message, 500);
        if (showAlerts) this.alertManager.error(apiError.message);
        throw apiError;
    }
}


 async get<T = any>(endpoint: string, params?: Record<string, any>, options?: any): Promise<ApiResponse<T>> {
        const allParams = { ...(params || {}), _t: Date.now() };
        const queryString = new URLSearchParams(
            Object.fromEntries(Object.entries(allParams).map(([k, v]) => [k, String(v)]))
        ).toString();
        const separator = endpoint.includes('?') ? '&' : '?';
        return this.request<T>('GET', `${endpoint}${separator}${queryString}`, undefined, options);
    }
    async post<T = any>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>> {
        return this.request<T>('POST', endpoint, data, options);
    }

    async put<T = any>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', endpoint, data, options);
    }

    async patch<T = any>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', endpoint, data, options);
    }

    async delete<T = any>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', endpoint, data, options);
    }

    cancelAllRequests(): void {
        this.pendingRequests.forEach(controller => controller.abort());
        this.pendingRequests.clear();
    }
}
export const connection = Connection.getInstance('/api');
