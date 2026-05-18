import { Renderer } from './renderer.js';
import { auth } from '../main.js';
export class Router {
    constructor(routes) {
        this.currentView = null;
        this.routes = Object.entries(routes).map(([path, component]) => ({
            path,
            component,
            protected: path.startsWith('/maintenance') || path.startsWith('/menu/search') || path.startsWith('/auth/search') || path.startsWith('/menu2222/'),
            admin: false
        }));
        this.renderer = Renderer.getInstance();
        this.setupEventListeners();
    }
    setupEventListeners() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            const target = e.target;
            const link = target.closest('a');
            if (link && link.origin === window.location.origin && !link.target && !link.hasAttribute('download')) {
                e.preventDefault();
                if (link.getAttribute('href')?.startsWith('#')) {
                    const id = link.getAttribute('href')?.slice(1);
                    if (id) {
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                else {
                    this.navigate(link.pathname + link.search + link.hash);
                }
            }
        });
    }
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
    async handleRoute() {
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
        this.cleanupModals();
        try {
            if (route) {
                await this.loadView(route, queryParams);
            }
            else {
                await this.show404();
            }
        }
        catch (error) {
            console.error('Error loading route:', error);
            await this.show404();
        }
        finally {
            this.renderer.showLoading(false);
            window.dispatchEvent(new CustomEvent('navigation-complete'));
        }
    }
    cleanupModals() {
        document.querySelectorAll('.card-info-film.visible').forEach(panel => {
            panel.classList.remove('visible');
            panel.setAttribute('aria-hidden', 'true');
        });
        document.body.classList.remove('movie-overlay-open');
        const container = document.getElementById('modal-container');
        const modalContent = document.getElementById('modal-content');
        if (container)
            container.classList.remove('active');
        if (modalContent)
            modalContent.classList.remove('visible');
    }
    async loadView(route, queryParams = {}) {
        if (this.currentView?.cleanup) {
            this.currentView.cleanup();
        }
        try {
            const module = await route.component();
            const ViewClass = module.default;
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
        }
        catch (error) {
            console.error('Error loading view:', error);
            throw error;
        }
    }
    async show404() {
        try {
            const module = await import('../views/NotFoundView.js');
            const NotFoundViewClass = module.default;
            if (typeof NotFoundViewClass === 'function') {
                const view = new NotFoundViewClass();
                const content = await view.render();
                this.renderer.renderPage({
                    title: '404 - Página no encontrada',
                    content
                });
                view.afterRender?.();
                return;
            }
            this.renderFallback404();
        }
        catch (error) {
            console.error('Error loading 404 view:', error);
            this.renderFallback404();
        }
    }
    renderFallback404() {
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
    getPageTitle(params) {
        const path = window.location.pathname;
        if (path === '/')
            return 'Inicio - Gestor de Películas';
        if (path.startsWith('/view')) {
            if (params.search)
                return `Búsqueda - ${params.search}`;
            if (params.id && params.id !== '0')
                return `Películas - ${params.id}`;
            return 'Películas Recientes';
        }
        if (path.startsWith('/menu/inventories')) {
            if (params.year)
                return `Inventarios - ${params.year}`;
            return 'Inventarios';
        }
        if (path.startsWith('/menu/search') || path.startsWith('/auth/search')) {
            return 'Búsqueda Avanzada';
        }
        if (path.startsWith('/login'))
            return 'Iniciar Sesión';
        if (path.startsWith('/signup'))
            return 'Registro';
        return 'Gestor de Películas';
    }
    matchRoute(path) {
        for (const route of this.routes) {
            const pattern = route.path
                .replace(/:\w+/g, '([^/]+)')
                .replace(/\//g, '\\/');
            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);
            if (match) {
                const paramNames = (route.path.match(/:\w+/g) || []).map(p => p.slice(1));
                const params = {};
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
    getCurrentView() {
        return this.currentView;
    }
}
