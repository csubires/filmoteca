import { connection, Connection } from '../core/connection.js';
import type { ApiResponse } from '../types/api.types.js';
import { AlertManager } from '../components/AlertManager.js';

export abstract class BaseService {
    protected connection: Connection;
    protected alertManager: AlertManager;

    constructor() {
        this.connection = connection;
        this.alertManager = AlertManager.getInstance();
    }

protected async handleRequest<T>(
        request: Promise<ApiResponse<T>>,
        errorMessage: string = 'Error en la operación'
    ): Promise<T | null> {
        try {
            const response = await request;
            return response.data;
        } catch (error: any) {
            console.error(errorMessage, error?.message, error?.status, error);
            return null;
        }
    }

    protected getCsrfToken(): string | null {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') ?? null;
    }
protected buildParams(params: Record<string, any>): Record<string, any> {
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
        params.csrf_token_form = csrfToken;
    }
    return params;
}
protected encodeParams(params: Record<string, any>): string {
    return new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
}

}
