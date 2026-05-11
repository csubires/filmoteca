export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface AlertConfig {
    message: string;
    type: AlertType;
    duration?: number;
    dismissible?: boolean;
}

export class AlertManager {
    private static instance: AlertManager;
    private container: HTMLElement;
    private alerts: Map<string, HTMLElement> = new Map();

    private constructor() {
        this.container = document.getElementById('alerts-container')!;
        if (!this.container) {
            this.createContainer();
        }
    }

    static getInstance(): AlertManager {
        if (!AlertManager.instance) {
            AlertManager.instance = new AlertManager();
        }
        return AlertManager.instance;
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'alerts-container';
        document.querySelector('.app')?.appendChild(this.container);
    }

    show(config: AlertConfig): string {
        const id = this.generateId();
        const alert = this.createAlertElement(id, config);

        this.container.prepend(alert);
        this.alerts.set(id, alert);

        if (config.duration !== 0) {
            setTimeout(() => this.dismiss(id), config.duration || 5000);
        }

        return id;
    }

    private createAlertElement(id: string, config: AlertConfig): HTMLElement {
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

    dismiss(id: string): void {
        const alert = this.alerts.get(id);
        if (alert) {
            alert.remove();
            this.alerts.delete(id);
        }
    }

    dismissAll(): void {
        this.alerts.forEach((_, id) => this.dismiss(id));
    }

    success(message: string, duration?: number): string {
        return this.show({ message, type: 'success', duration });
    }

    error(message: string, duration?: number): string {
        return this.show({ message, type: 'danger', duration });
    }

    warning(message: string, duration?: number): string {
        return this.show({ message, type: 'warning', duration });
    }

    info(message: string, duration?: number): string {
        return this.show({ message, type: 'info', duration });
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9);
    }
}
