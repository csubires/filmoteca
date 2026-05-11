import { BaseService } from './BaseService.js';
import {
    TorrentTaskStatus,
    TorrentStartResponse,
    TorrentStopResponse,
    TorrentConfig,
    TorrentMovie,
    TorrentSerie
} from '../types/torrent.types.js';

export class TorrentService extends BaseService {
    private currentTaskId: string | null = null;
    private isTaskRunning: boolean = false;
    private pollInterval: number | null = null;

    // Iniciar tarea de torrent
    async startTask(): Promise<string | null> {
        try {
            const response = await fetch('/api/start_torrent_task', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': this.getCsrfToken() || ''
                }
            });

            const data = await response.json() as TorrentStartResponse;

            if (data?.taskId) {
                this.currentTaskId = data.taskId;
                this.isTaskRunning = true;
                this.startPolling();
                return data.taskId;
            }
            return null;
        } catch (error) {
            console.error('Error starting torrent task:', error);
            return null;
        }
    }

    // Obtener estado de la tarea
    async getTaskStatus(taskId: string): Promise<TorrentTaskStatus | null> {
        return this.handleRequest(
            this.connection.get<TorrentTaskStatus>(
                `/torrent_task_status?taskId=${taskId}&stamp=${Date.now()}`
            ),
            'Error al obtener estado de tarea torrent'
        );
    }

    // Detener tarea
    async stopTask(): Promise<boolean> {
        if (!this.currentTaskId) return false;

        try {
            const response = await fetch('/api/stop_torrent_task', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken() || ''
                }
            });

            const result = await response.json() as TorrentStopResponse;

            if (result.success) {
                this.stopPolling();
                this.resetTask();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error stopping task:', error);
            return false;
        }
    }

    // Guardar configuración
    async saveConfig(config: TorrentConfig): Promise<boolean> {
        const response = await this.connection.put(
            '/update_urlend',
            this.buildParams(config)
        );
        return !!response;
    }

    // Obtener configuración actual
    async getConfig(): Promise<TorrentConfig | null> {
        return this.handleRequest(
            this.connection.get<TorrentConfig>(
                `/get_config/${this.encodeParams({})}`
            ),
            'Error al obtener configuración'
        );
    }

    // Obtener películas disponibles
    async getMovies(): Promise<TorrentMovie[] | null> {
        return this.handleRequest(
            this.connection.get<TorrentMovie[]>(
                `/get_torrent_movies/${this.encodeParams({})}`
            ),
            'Error al obtener películas torrent'
        );
    }

    // Obtener series disponibles
    async getSeries(): Promise<TorrentSerie[] | null> {
        return this.handleRequest(
            this.connection.get<TorrentSerie[]>(
                `/get_torrent_series/${this.encodeParams({})}`
            ),
            'Error al obtener series torrent'
        );
    }

    // Polling de estado
    private startPolling(): void {
        if (this.pollInterval) return;

        this.pollInterval = window.setInterval(async () => {
            if (!this.currentTaskId || !this.isTaskRunning) return;

            const status = await this.getTaskStatus(this.currentTaskId);

            if (status?.task_status === 'completed' ||
                status?.task_status === 'failed' ||
                status?.task_status === 'cancelled') {
                this.stopPolling();
                this.resetTask();

                // Disparar evento
                window.dispatchEvent(new CustomEvent('torrent-task-complete', {
                    detail: status
                }));
            }
        }, 5000); // Cada 5 segundos
    }

    private stopPolling(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // Estado
    isRunning(): boolean {
        return this.isTaskRunning;
    }

    getCurrentTaskId(): string | null {
        return this.currentTaskId;
    }

    resetTask(): void {
        this.currentTaskId = null;
        this.isTaskRunning = false;
    }

    // Verificar estado inicial
    async checkInitialState(): Promise<void> {
        try {
            const response = await this.connection.get<TorrentTaskStatus>(
                '/torrent_task_status'
            );

            if (response?.data) {
                const status = response.data.task_status;
                if (status === 'running' || status === 'pending') {
                    this.isTaskRunning = true;
                    this.startPolling();
                }
            }
        } catch (error) {
            console.log('No hay tareas en ejecución');
        }
    }
}
