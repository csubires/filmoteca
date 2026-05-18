import { Renderer } from '../core/renderer.js';
import { connection } from '../core/connection.js';
import { AlertManager } from '../components/AlertManager.js';
import { ModalManager } from '../components/ModalManager.js';
import { auth } from '../main.js';

export interface ViewParams {
    [key: string]: string;
}

export abstract class BaseView {
    protected renderer: Renderer;
    protected alertManager: AlertManager;
    protected modalManager: ModalManager;
    protected params: ViewParams = {};

    constructor() {
        this.renderer = Renderer.getInstance();
        this.alertManager = AlertManager.getInstance();
        this.modalManager = ModalManager.getInstance();
    }

    // Método principal de renderizado
    abstract render(params?: ViewParams): Promise<string>;

    // Hook después del renderizado
    afterRender(params?: ViewParams): void {
        this.params = params || {};
        this.setupEventListeners();
        this.loadData();
    }

    // Limpieza antes de destruir la vista
    cleanup(): void {
        this.removeEventListeners();
    }

    // Configurar event listeners específicos de la vista
    protected setupEventListeners(): void {
        // Sobrescribir en vistas hijas
    }

    // Eliminar event listeners
    protected removeEventListeners(): void {
        // Sobrescribir en vistas hijas
    }

    // Cargar datos iniciales
    protected async loadData(): Promise<void> {
        // Sobrescribir en vistas hijas
    }

    // Mostrar loader
    protected showLoader(show: boolean = true): void {
        this.renderer.showLoading(show);
    }

    // Obtener elemento del DOM con tipo seguro
    protected getElement<T extends HTMLElement>(id: string): T | null {
        return document.getElementById(id) as T | null;
    }

    // Obtener múltiples elementos
    protected getElements<T extends HTMLElement>(selector: string): T[] {
        return Array.from(document.querySelectorAll(selector)) as T[];
    }

    // Renderizar template
    protected renderTemplate(templateId: string, data: Record<string, any>): string {
        return this.renderer.renderTemplate(templateId, data);
    }

    // Renderizar lista
    protected renderList(templateId: string, items: any[], containerId: string): void {
        this.renderer.renderList(templateId, items, containerId);
    }

    // Verificar autenticación
    protected requireAuth(): boolean {
        if (!auth.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    // Verificar rol admin
    protected requireAdmin(): boolean {
        if (!this.requireAuth()) return false;
        if (auth.getUser()?.role !== 'admin') {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    // Navegar
    protected navigate(path: string): void {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    // Recargar vista actual
    protected reload(): void {
        this.navigate(window.location.pathname);
    }

    protected getAuthToken(): string | null {
        return null;
    }

    // Formatear fecha
    protected formatDate(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Manejar errores
    protected handleError(error: any, message: string = 'Error inesperado'): void {
        console.error(message, error);
        this.alertManager.error(message);
    }

    // Confirmar acción
    protected confirm(message: string): Promise<boolean> {
        return this.modalManager.confirm(message, {
            title: 'Confirmación',
            confirmText: 'Aceptar',
            cancelText: 'Cancelar'
        });
    }

    // Debounce para búsquedas
    protected debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: number | null = null;
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }
}

export default BaseView;
