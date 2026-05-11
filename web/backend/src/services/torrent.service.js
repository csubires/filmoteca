const { EventEmitter } = require('events');

class TorrentService extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map();
        this.currentTaskId = null;
    }

    async startTask() {
        const taskId = `torrent_${Date.now()}`;
        this.tasks.set(taskId, { status: 'pending' });

        setImmediate(() => this.runTask(taskId));

        return taskId;
    }

    async runTask(taskId) {
        try {
            this.currentTaskId = taskId;
            const task = this.tasks.get(taskId);
            if (!task) return;

            task.status = 'running';
            this.emit('taskUpdate', taskId, task);

            await new Promise(resolve => setTimeout(resolve, 1000));

            if (task.status === 'cancelled') {
                return;
            }

            const result = {
                status: 'completed',
                type: 'torrent_search',
                data: { message: 'Búsqueda completada' }
            };

            const currentTask = this.tasks.get(taskId);
            if (currentTask && currentTask.status !== 'cancelled') {
                this.tasks.set(taskId, {
                    status: result.status,
                    data: result.data,
                    type: result.type
                });
                this.emit('taskUpdate', taskId, this.tasks.get(taskId));
            }
        } catch (error) {
            const task = this.tasks.get(taskId);
            if (task && task.status !== 'cancelled') {
                this.tasks.set(taskId, {
                    status: 'failed',
                    error: error.message
                });
            }
        } finally {
            this.currentTaskId = null;
        }
    }

    getTaskStatus(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return null;

        const response = {
            task_status: task.status,
            type: task.type,
            data: task.data,
            error: task.error
        };

        if (task.status === 'completed' || task.status === 'failed') {
            setTimeout(() => {
                if (this.tasks.has(taskId)) {
                    this.tasks.delete(taskId);
                }
            }, 300000);
        }

        return response;
    }

    stopCurrentTask() {
        if (this.currentTaskId && this.tasks.has(this.currentTaskId)) {
            this.tasks.set(this.currentTaskId, {
                status: 'cancelled',
                error: 'Tarea cancelada por el usuario'
            });
            this.currentTaskId = null;
            return true;
        }
        return false;
    }

    isTaskRunning() {
        return this.currentTaskId !== null;
    }
}

module.exports = new TorrentService();
