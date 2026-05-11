import { BaseService } from './BaseService.js';
export class TorrentService extends BaseService {
    constructor() {
        super(...arguments);
        this.currentTaskId = null;
        this.isTaskRunning = false;
        this.pollInterval = null;
    }
    async startTask() {
        try {
            const response = await fetch('/api/start_torrent_task', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': this.getCsrfToken() || ''
                }
            });
            const data = await response.json();
            if (data?.taskId) {
                this.currentTaskId = data.taskId;
                this.isTaskRunning = true;
                this.startPolling();
                return data.taskId;
            }
            return null;
        }
        catch (error) {
            console.error('Error starting torrent task:', error);
            return null;
        }
    }
    async getTaskStatus(taskId) {
        return this.handleRequest(this.connection.get(`/torrent_task_status?taskId=${taskId}&stamp=${Date.now()}`), 'Error al obtener estado de tarea torrent');
    }
    async stopTask() {
        if (!this.currentTaskId)
            return false;
        try {
            const response = await fetch('/api/stop_torrent_task', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken() || ''
                }
            });
            const result = await response.json();
            if (result.success) {
                this.stopPolling();
                this.resetTask();
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error stopping task:', error);
            return false;
        }
    }
    async saveConfig(config) {
        const response = await this.connection.put('/update_urlend', this.buildParams(config));
        return !!response;
    }
    async getConfig() {
        return this.handleRequest(this.connection.get(`/get_config/${this.encodeParams({})}`), 'Error al obtener configuración');
    }
    async getMovies() {
        return this.handleRequest(this.connection.get(`/get_torrent_movies/${this.encodeParams({})}`), 'Error al obtener películas torrent');
    }
    async getSeries() {
        return this.handleRequest(this.connection.get(`/get_torrent_series/${this.encodeParams({})}`), 'Error al obtener series torrent');
    }
    startPolling() {
        if (this.pollInterval)
            return;
        this.pollInterval = window.setInterval(async () => {
            if (!this.currentTaskId || !this.isTaskRunning)
                return;
            const status = await this.getTaskStatus(this.currentTaskId);
            if (status?.task_status === 'completed' ||
                status?.task_status === 'failed' ||
                status?.task_status === 'cancelled') {
                this.stopPolling();
                this.resetTask();
                window.dispatchEvent(new CustomEvent('torrent-task-complete', {
                    detail: status
                }));
            }
        }, 5000);
    }
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    isRunning() {
        return this.isTaskRunning;
    }
    getCurrentTaskId() {
        return this.currentTaskId;
    }
    resetTask() {
        this.currentTaskId = null;
        this.isTaskRunning = false;
    }
    async checkInitialState() {
        try {
            const response = await this.connection.get('/torrent_task_status');
            if (response?.data) {
                const status = response.data.task_status;
                if (status === 'running' || status === 'pending') {
                    this.isTaskRunning = true;
                    this.startPolling();
                }
            }
        }
        catch (error) {
            console.log('No hay tareas en ejecución');
        }
    }
}
