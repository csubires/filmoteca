import { connection } from '../core/connection.js';
import { AlertManager } from '../components/AlertManager.js';
export class BaseService {
    constructor() {
        this.connection = connection;
        this.alertManager = AlertManager.getInstance();
    }
    async handleRequest(request, errorMessage = 'Error en la operación') {
        try {
            const response = await request;
            return response.data;
        }
        catch (error) {
            console.error(errorMessage, error?.message, error?.status, error);
            return null;
        }
    }
    getFormToken() {
        return null;
    }
    buildParams(params) {
        return params;
    }
    encodeParams(params) {
        return new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString();
    }
}
