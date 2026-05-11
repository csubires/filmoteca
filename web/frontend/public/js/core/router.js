import { Renderer } from './renderer.js';
import { auth } from '../main.js';
export class Router {
    constructor(routes) {
        this.currentView = null;
        this.routes = Object.entries(routes).map(([path, component]) => ({
            path,
            component,
            protected: path.startsWith('/maintenance') || path.startsWith('/menu2222/'),
            admin: path.startsWith('/maintenance')
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
        const path = window.location.pathname;
        const route = this.matchRoute(path);
        if (route?.protected && !auth.isAuthenticated()) {
            this.navigate('/login');
            return;
        }
        if (route?.admin && auth.getUser()?.role !== 'admin') {
            this.navigate('/');
            return;
        }
        this.renderer.showLoading(true);
        try {
            if (route) {
                await this.loadView(route);
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
    async loadView(route) {
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
            const content = await view.render(route.params);
            this.renderer.renderPage({
                title: this.getPageTitle(route.params),
                content
            });
            view.afterRender?.(route.params);
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
        if (path.startsWith('/view'))
            return `Películas - ${params.id === '0' ? 'Recientes' : `Género ${params.id}`}`;
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
