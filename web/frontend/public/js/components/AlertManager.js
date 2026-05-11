export class AlertManager {
    constructor() {
        this.alerts = new Map();
        this.container = document.getElementById('alerts-container');
        if (!this.container) {
            this.createContainer();
        }
    }
    static getInstance() {
        if (!AlertManager.instance) {
            AlertManager.instance = new AlertManager();
        }
        return AlertManager.instance;
    }
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'alerts-container';
        document.querySelector('.app')?.appendChild(this.container);
    }
    show(config) {
        const id = this.generateId();
        const alert = this.createAlertElement(id, config);
        this.container.prepend(alert);
        this.alerts.set(id, alert);
        if (config.duration !== 0) {
            setTimeout(() => this.dismiss(id), config.duration || 5000);
        }
        return id;
    }
    createAlertElement(id, config) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${config.type}`;
        alert.id = `alert-${id}`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <svg class="bi" role="img" aria-label="${config.type}:">
                <use href="#${config.type}-icon"/>
            </svg>
            <div>${config.message}</div>
            ${config.dismissible !== false ? `
                <button type="button" class="btn-close" aria-label="Close"></button>
            ` : ''}
        `;
        if (config.dismissible !== false) {
            alert.querySelector('.btn-close')?.addEventListener('click', () => {
                this.dismiss(id);
            });
        }
        return alert;
    }
    dismiss(id) {
        const alert = this.alerts.get(id);
        if (alert) {
            alert.remove();
            this.alerts.delete(id);
        }
    }
    dismissAll() {
        this.alerts.forEach((_, id) => this.dismiss(id));
    }
    success(message, duration) {
        return this.show({ message, type: 'success', duration });
    }
    error(message, duration) {
        return this.show({ message, type: 'danger', duration });
    }
    warning(message, duration) {
        return this.show({ message, type: 'warning', duration });
    }
    info(message, duration) {
        return this.show({ message, type: 'info', duration });
    }
    generateId() {
        return Math.random().toString(36).substring(2, 9);
    }
}
