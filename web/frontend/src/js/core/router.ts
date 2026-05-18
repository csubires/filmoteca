// js/core/router.ts
import { Renderer } from './renderer.js';
import { auth } from '../main.js';
import { PageConfig } from './renderer.js';

// Definir interfaces
export interface View {
    render(params?: Record<string, string>): Promise<string>;
    afterRender?(params?: Record<string, string>): void;
    cleanup?(): void;
}

interface Route {
    path: string;
    component: () => Promise<{ default: new () => View }>;
    protected?: boolean;
    admin?: boolean;
}

interface RouteWithParams extends Route {
    path: string;
    params: Record<string, string>;
}

export class Router {
    private routes: Route[];
    private currentView: View | null = null;
    private renderer: Renderer;

    constructor(routes: Record<string, () => Promise<{ default: new () => View }>>) {
        this.routes = Object.entries(routes).map(([path, component]) => ({
            path,
            component,
            protected: path.startsWith('/maintenance') || path.startsWith('/menu/search') || path.startsWith('/auth/search') || path.startsWith('/menu2222/'),
            admin: false
        }));
        this.renderer = Renderer.getInstance();
        this.setupEventListeners();
    }

    protected setupEventListeners(): void {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link && link.origin === window.location.origin && !link.target && !link.hasAttribute('download')) {
                e.preventDefault();
                if (link.getAttribute('href')?.startsWith('#')) {
                    const id = link.getAttribute('href')?.slice(1);
                    if (id) {
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    this.navigate(link.pathname + link.search + link.hash);
                }
            }
        });
    }

    navigate(path: string): void {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

async handleRoute(): Promise<void> {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const route = this.matchRoute(path);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    if (route?.protected && !auth.isAuthenticated()) {
        this.navigate('/login');
        return;
    }

    if (route?.admin && auth.getUser()?.role !== 'admin') {
        this.navigate('/');
        return;
    }

    this.renderer.showLoading(true);

    // Limpiar todos los modales abiertos antes de navegar
    this.cleanupModals();

    try {
        if (route) {
            await this.loadView(route, queryParams);
        } else {
            await this.show404();
        }
    } catch (error) {
        console.error('Error loading route:', error);
        await this.show404();
    } finally {
        this.renderer.showLoading(false);
        // Disparar evento de navegación completada
        window.dispatchEvent(new CustomEvent('navigation-complete'));
    }
}

private cleanupModals(): void {
    // Cerrar todos los paneles de información de películas
    document.querySelectorAll('.card-info-film.visible').forEach(panel => {
        panel.classList.remove('visible');
        panel.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('movie-overlay-open');

    // Cerrar modal si existe
    const container = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    if (container) container.classList.remove('active');
    if (modalContent) modalContent.classList.remove('visible');
}



    private async loadView(route: RouteWithParams, queryParams: Record<string, string> = {}): Promise<void> {
        if (this.currentView?.cleanup) {
            this.currentView.cleanup();
        }

        try {
            const module = await route.component();
            const ViewClass = module.default;

            // Verificar que ViewClass sea constructible
            if (typeof ViewClass !== 'function') {
                throw new Error('El componente no es una clase válida');
            }

            const view = new ViewClass();
            this.currentView = view;
            const params = { ...route.params, ...queryParams };

            const content = await view.render(params);
            this.renderer.renderPage({
                title: this.getPageTitle(params),
                content
            });

            view.afterRender?.(params);
        } catch (error) {
            console.error('Error loading view:', error);
            throw error;
        }
    }

    private async show404(): Promise<void> {
        try {
            // Importar directamente con la sintaxis correcta
            const module = await import('../views/NotFoundView.js');

            // Acceder a default de manera segura
            const NotFoundViewClass = (module as any).default;

            if (typeof NotFoundViewClass === 'function') {
                const view = new NotFoundViewClass() as View;
                const content = await view.render();

                this.renderer.renderPage({
                    title: '404 - Página no encontrada',
                    content
                });

                view.afterRender?.();
                return;
            }

            // Fallback si no es una clase
            this.renderFallback404();

        } catch (error) {
            console.error('Error loading 404 view:', error);
            this.renderFallback404();
        }
    }

    private renderFallback404(): void {
        this.renderer.renderPage({
            title: '404 - Página no encontrada',
            content: `
                <div class="container">
                    <div class="container-global-data">
                        <h3>404 - Página no encontrada</h3>
                        <p>El recurso o página al que intenta acceder no existe o no está disponible.</p>
                        <p>Pongase en contacto con un administrador si necesita ayuda.</p>
                        <div style="margin-top: 2rem;">
                            <a href="/" class="btn btn-primary">Volver al inicio</a>
                        </div>
                    </div>
                </div>
            `
        });
    }

    private getPageTitle(params: Record<string, string>): string {
        const path = window.location.pathname;
        if (path === '/') return 'Inicio - Gestor de Películas';
        if (path.startsWith('/view')) {
            if (params.search) return `Búsqueda - ${params.search}`;
            if (params.id && params.id !== '0') return `Películas - ${params.id}`;
            return 'Películas Recientes';
        }
        if (path.startsWith('/menu/inventories')) {
            if (params.year) return `Inventarios - ${params.year}`;
            return 'Inventarios';
        }
        if (path.startsWith('/menu/search') || path.startsWith('/auth/search')) {
            return 'Búsqueda Avanzada';
        }
        if (path.startsWith('/login')) return 'Iniciar Sesión';
        if (path.startsWith('/signup')) return 'Registro';
        return 'Gestor de Películas';
    }

    private matchRoute(path: string): RouteWithParams | null {
        for (const route of this.routes) {
            const pattern = route.path
                .replace(/:\w+/g, '([^/]+)')
                .replace(/\//g, '\\/');
            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);

            if (match) {
                const paramNames = (route.path.match(/:\w+/g) || []).map(p => p.slice(1));
                const params: Record<string, string> = {};

                paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });

                return {
                    path: route.path,
                    component: route.component,
                    params,
                    protected: route.protected,
                    admin: route.admin
                };
            }
        }
        return null;
    }

    getCurrentView(): View | null {
        return this.currentView;
    }
}
