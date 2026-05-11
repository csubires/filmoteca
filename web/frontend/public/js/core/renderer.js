export class Renderer {
    constructor() {
        this.loader = null;
        this.mainContent = document.querySelector('#main-content');
    }
    static getInstance() {
        if (!Renderer.instance) {
            Renderer.instance = new Renderer();
        }
        return Renderer.instance;
    }
    renderPage(config) {
        document.title = config.title;
        this.mainContent.innerHTML = config.content;
        window.scrollTo(0, 0);
        const currentPath = window.location.pathname;
        document.querySelectorAll('#nav-menu a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href === currentPath || (href !== '/' && currentPath.startsWith(href)))) {
                link.classList.add('active');
            }
            else {
                link.classList.remove('active');
            }
        });
        setTimeout(() => config.afterRender?.(), 0);
    }
    renderTemplate(templateId, data) {
        const template = document.getElementById(templateId);
        if (!template)
            return '';
        let html = template.innerHTML;
        for (const [key, value] of Object.entries(data)) {
            html = html.split(`{${key}}`).join(value?.toString() || '');
        }
        return html;
    }
    renderList(templateId, items, containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = items.map(item => this.renderTemplate(templateId, item)).join('');
        }
    }
    showLoading(show = true) {
        if (!this.loader) {
            this.loader = document.createElement('div');
            this.loader.id = 'global-loader';
            this.loader.innerHTML = '<div class="spinner"></div><span>Cargando...</span>';
            document.body.appendChild(this.loader);
        }
        this.loader.style.display = show ? 'flex' : 'none';
    }
}
