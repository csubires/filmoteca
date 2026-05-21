import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Task management
const activeTasks = new Map();

// Utility functions
function getTodayDate() {
	const now = new Date();
	return now.getFullYear().toString() +
		   String(now.getMonth() + 1).padStart(2, '0') +
		   String(now.getDate()).padStart(2, '0');
}

// torrent routes

export default async function torrentRoutes(fastify) {
	const db = fastify.db;

	// Get torrent configuration
	fastify.get('/get_config', async (request, reply) => {
		try {
			fastify.log.info('GET /get_config - Executing select_urlend query');
			const result = await db.execute('select_urlend', {});
			fastify.log.info(`select_urlend result: ${JSON.stringify(result)}`);

			if (!result || result.length === 0) {
				fastify.log.info('No config found in DB, returning defaults');
				return { data: { url_end: null, date_end: null, npseries: 1 }, status: 200 };
			}
			const { url_end, date_end, npseries } = result[0];
			fastify.log.info(`Config loaded: url_end=${url_end}, date_end=${date_end}, npseries=${npseries}`);
			return { data: { url_end, date_end, npseries }, status: 200 };
		} catch (error) {
			fastify.log.error('Error in /get_config:', error.message || error);
			fastify.log.error('Error stack:', error.stack);
			fastify.log.error('Available queries:', Object.keys(db.queries || {}));
			return reply.code(500).send({ error: error.message, details: error.toString(), stack: error.stack });
		}
	});

	// Get torrent movies - read from DB torrent_cache for today's date
	fastify.get('/get_torrent_movies', async (request, reply) => {
		try {
			const today = getTodayDate();
			const cache = await db.execute('select_torrent_cache_by_date', { ':date_cached': today });
			if (cache && cache.length > 0) {
				try {
					const movies = JSON.parse(cache[0].movies_json || '[]');
					return { data: movies, status: 200 };
				} catch (e) {
					fastify.log.error('Error parsing movies_json from torrent_cache', e);
					return { data: [], status: 200 };
				}
			}
			return { data: [], status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Get torrent series - read from DB torrent_cache for today's date
	fastify.get('/get_torrent_series', async (request, reply) => {
		try {
			const today = getTodayDate();
			const cache = await db.execute('select_torrent_cache_by_date', { ':date_cached': today });
			if (cache && cache.length > 0) {
				try {
					const series = JSON.parse(cache[0].series_json || '[]');
					return { data: series, status: 200 };
				} catch (e) {
					fastify.log.error('Error parsing series_json from torrent_cache', e);
					return { data: [], status: 200 };
				}
			}
			return { data: [], status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Legacy start_torrent_task removed - use /api/execute_task

	// Legacy torrent_task_status and stop_torrent_task removed - use /task_status and /stop_task

	// Generic execute task (uses interface.py)
	fastify.post('/execute_task', async (request, reply) => {
		try {
			const { task, config } = request.body || {};
			if (!task) return reply.code(400).send({ error: 'No task specified' });

			const taskId = `${task}_${Date.now()}`;
			fastify.log.info(`POST /execute_task - Task: ${task}, Task ID: ${taskId}`);

			// Spawn Python adapter from project root
			const pythonScriptPath = path.join(__dirname, '../../../app/adapter/interface.py');
			const projectRoot = path.join(__dirname, '../../../');

			const taskConfig = config || {};

			fastify.log.info(`Spawning Python: ${pythonScriptPath}`);
			fastify.log.info(`Working directory: ${projectRoot}`);
			fastify.log.info(`Task: ${task} with config: ${JSON.stringify(taskConfig)}`);

			const pythonProcess = spawn('python3', [pythonScriptPath, task, JSON.stringify(taskConfig)], {
				cwd: projectRoot,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					PYTHONUNBUFFERED: '1',
					PYTHONDONTWRITEBYTECODE: '1'
				}
			});

			const taskData = {
				id: taskId,
				process: pythonProcess,
				status: 'running',
				progress: 0,
				message: `Iniciando tarea ${task}...`,
				startTime: Date.now(),
				shouldStop: false,
				output: ''
			};

			function appendTaskOutput(line) {
				if (!line) return;
				taskData.output += line + '\n';
				fastify.log.info(`[Task ${taskId}] ${line}`);

				if (line.includes('PROGRESO:')) {
					const match = line.match(/PROGRESO:(\d+)/);
					if (match) taskData.progress = parseInt(match[1]);
				}

				if (line.startsWith('LOG:')) {
					taskData.message = line.replace(/^LOG:\s*/, '') || taskData.message;
				}

				if (line.includes('TAREA COMPLETADA')) {
					taskData.status = 'completed';
				}
			}

			pythonProcess.stdout.on('data', (data) => {
				const output = data.toString().trim();
				const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
				lines.forEach(appendTaskOutput);

				// Log JSON parsing for debugging (torrent task)
				if (task === 'torrent') {
					for (const line of lines) {
						try {
							if (line.startsWith('{') && line.endsWith('}')) {
								const result = JSON.parse(line);
								if (result.data && Array.isArray(result.data)) {
									fastify.log.info(`Torrent task completed with ${result.data[0]?.length || 0} movies and ${result.data[1]?.length || 0} series`);
									// Python adapter already saves to torrent_cache, no need to duplicate
									break;
								}
							}
						} catch (e) {
							// ignore parse errors for this line and continue
						}
					}
				}
			});

			pythonProcess.stderr.on('data', (data) => {
				const error = data.toString().trim();
				error.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
					taskData.output += line + '\n';
					fastify.log.error(`[Task ${taskId}] ${line}`);
					if (!taskData.error) taskData.error = line;
					if (line && taskData.status !== 'cancelled') {
						taskData.status = 'failed';
						taskData.message = line;
					}
				});
			});

			pythonProcess.on('error', (err) => {
				fastify.log.error(`[Task ${taskId}] Process error: ${err && err.message ? err.message : err}`);
				taskData.error = (err && err.message) || String(err);
				taskData.status = 'failed';
			});

			pythonProcess.on('close', (code) => {
				fastify.log.info(`[Task ${taskId}] Process exited with code ${code}`);
				if (code !== 0 && taskData.status !== 'cancelled') {
					taskData.status = 'failed';
				} else if (taskData.status !== 'completed') {
					taskData.status = taskData.shouldStop ? 'cancelled' : (code === 0 ? 'completed' : 'failed');
				}
				setTimeout(() => activeTasks.delete(taskId), 30000);
			});

			activeTasks.set(taskId, taskData);

			return { taskId, status: 200 };
		} catch (error) {
			fastify.log.error('Error executing task:', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// Generic task status
	fastify.get('/task_status', async (request, reply) => {
		try {
			fastify.log.info(`/task_status query: ${JSON.stringify(request.query)}`);
			const taskId = request.query.taskId;
			if (!taskId) return { data: { task_status: 'no_task' }, status: 200 };

			const taskData = activeTasks.get(taskId);
			fastify.log.info({ taskId, hasTask: !!taskData, activeCount: activeTasks.size }, 'task_status lookup');
			if (!taskData) return { data: { task_status: 'not_found' }, status: 200 };

			return {
				data: {
					task_status: taskData.status,
					progress: taskData.progress,
					message: taskData.message,
					error: taskData.error,
					output: taskData.output
				},
				status: 200
			};
		} catch (error) {
			fastify.log.error('Error in /task_status:', error);
			return reply.code(500).send({ error: error.message, stack: error.stack });
		}
	});

	// Generic stop task
	fastify.post('/stop_task', async (request, reply) => {
		try {
			const taskId = request.body?.taskId;
			if (!taskId) return { success: false, message: 'No taskId provided', status: 200 };

			const taskData = activeTasks.get(taskId);
			if (!taskData) return { success: false, message: 'Task not found', status: 200 };

			taskData.shouldStop = true;
			taskData.status = 'stopping';

			if (taskData.process && !taskData.process.killed) {
				taskData.process.kill('SIGTERM');
				setTimeout(() => {
					if (taskData.process && !taskData.process.killed) {
						taskData.process.kill('SIGKILL');
					}
				}, 5000);
			}

			return { success: true, message: 'Task stopped', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
