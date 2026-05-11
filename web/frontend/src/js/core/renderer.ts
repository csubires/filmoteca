// RENDERER.TS COMPLETO CORREGIDO:
import { showMessage } from '../utils.js';

export interface PageConfig {
    title: string;
    content: string;
    afterRender?: () => void;
}

export class Renderer {
    private static instance: Renderer;
    private mainContent: HTMLElement;
    private loader: HTMLElement | null = null;

    private constructor() {
        this.mainContent = document.querySelector('#main-content')!;
    }

    static getInstance(): Renderer {
        if (!Renderer.instance) {
            Renderer.instance = new Renderer();
        }
        return Renderer.instance;
    }

renderPage(config: PageConfig): void {
    document.title = config.title;
    this.mainContent.innerHTML = config.content;
    window.scrollTo(0, 0);

    // Actualizar clases activas en el menú
    const currentPath = window.location.pathname;
    document.querySelectorAll('#nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPath || (href !== '/' && currentPath.startsWith(href)))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    setTimeout(() => config.afterRender?.(), 0);
}

    renderTemplate(templateId: string, data: Record<string, any>): string {
        const template = document.getElementById(templateId) as HTMLTemplateElement;
        if (!template) return '';
        let html = template.innerHTML;
        for (const [key, value] of Object.entries(data)) {
            html = html.split(`{${key}}`).join(value?.toString() || '');
        }
        return html;
    }

    renderList(templateId: string, items: any[], containerId: string): void {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = items.map(item => this.renderTemplate(templateId, item)).join('');
        }
    }

    showLoading(show: boolean = true): void {
        if (!this.loader) {
            this.loader = document.createElement('div');
            this.loader.id = 'global-loader';
            this.loader.innerHTML = '<div class="spinner"></div><span>Cargando...</span>';
            document.body.appendChild(this.loader);
        }
        this.loader.style.display = show ? 'flex' : 'none';
    }
}
