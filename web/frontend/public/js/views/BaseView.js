import { Renderer } from '../core/renderer.js';
import { AlertManager } from '../components/AlertManager.js';
import { ModalManager } from '../components/ModalManager.js';
import { auth } from '../main.js';
export class BaseView {
    constructor() {
        this.params = {};
        this.renderer = Renderer.getInstance();
        this.alertManager = AlertManager.getInstance();
        this.modalManager = ModalManager.getInstance();
    }
    afterRender(params) {
        this.params = params || {};
        this.setupEventListeners();
        this.loadData();
    }
    cleanup() {
        this.removeEventListeners();
    }
    setupEventListeners() {
    }
    removeEventListeners() {
    }
    async loadData() {
    }
    showLoader(show = true) {
        this.renderer.showLoading(show);
    }
    getElement(id) {
        return document.getElementById(id);
    }
    getElements(selector) {
        return Array.from(document.querySelectorAll(selector));
    }
    renderTemplate(templateId, data) {
        return this.renderer.renderTemplate(templateId, data);
    }
    renderList(templateId, items, containerId) {
        this.renderer.renderList(templateId, items, containerId);
    }
    requireAuth() {
        if (!auth.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
    requireAdmin() {
        if (!this.requireAuth())
            return false;
        if (auth.getUser()?.role !== 'admin') {
            window.location.href = '/';
            return false;
        }
        return true;
    }
    navigate(path) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
    reload() {
        this.navigate(window.location.pathname);
    }
    getAuthToken() {
        return null;
    }
    formatDate(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    handleError(error, message = 'Error inesperado') {
        console.error(message, error);
        this.alertManager.error(message);
    }
    confirm(message) {
        return this.modalManager.confirm(message, {
            title: 'Confirmación',
            confirmText: 'Aceptar',
            cancelText: 'Cancelar'
        });
    }
    debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }
}
export default BaseView;
