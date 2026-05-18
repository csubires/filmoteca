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
				return { url_end: null, date_end: null, npseries: 1, status: 200 };
			}
			const { url_end, date_end, npseries } = result[0];
			fastify.log.info(`Config loaded: url_end=${url_end}, date_end=${date_end}, npseries=${npseries}`);
			return { url_end, date_end, npseries, status: 200 };
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

			pythonProcess.stdout.on('data', (data) => {
				const output = data.toString().trim();
				taskData.output += output + '\n';
				fastify.log.info(`[Task ${taskId}] ${output}`);

				if (output.includes('PROGRESO:')) {
					const match = output.match(/PROGRESO:(\d+)/);
					if (match) taskData.progress = parseInt(match[1]);
				}

				if (output.includes('TAREA COMPLETADA')) {
					taskData.status = 'completed';
				}

				// Try to parse JSON result for caching if it's a torrent task
				try {
					if (task === 'torrent' && output.startsWith('{') && output.endsWith('}')) {
						const result = JSON.parse(output);
						if (result.data && Array.isArray(result.data)) {
							const today = getTodayDate();
							const cacheData = {
								date_end: result.data[3] || today,
								url_end: result.data[2] || null,
								npseries: result.data[4] || 1,
								movies: result.data[0] || [],
								series: result.data[1] || []
							};
							// Persistir en DB (insert or update)
							(async () => {
								try {
									const existing = await db.execute('select_torrent_cache_by_date', { ':date_cached': today });
									const movies_json = JSON.stringify(cacheData.movies);
									const series_json = JSON.stringify(cacheData.series);
									if (existing && existing.length > 0) {
										await db.execute('update_torrent_cache', {
											':movies_json': movies_json,
											':series_json': series_json,
											':url_end': cacheData.url_end,
											':npseries': cacheData.npseries,
											':date_cached': today
										});
									} else {
										await db.execute('insert_torrent_cache', {
											':date_cached': today,
											':movies_json': movies_json,
											':series_json': series_json,
											':url_end': cacheData.url_end,
											':npseries': cacheData.npseries
										});
									}
									fastify.log.info(`Torrent cache saved with ${cacheData.movies.length} movies and ${cacheData.series.length} series`);
								} catch (err) {
									fastify.log.error('Error saving torrent cache to DB', err);
								}
							})();
						}
					}
				} catch (e) {
					// ignore parse errors
				}
			});

			pythonProcess.stderr.on('data', (data) => {
				const error = data.toString().trim();
				taskData.output += error + '\n';
				fastify.log.error(`[Task ${taskId}] ${error}`);
				if (!taskData.error) taskData.error = error;
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
			const taskId = request.query.taskId;
			if (!taskId) return { task_status: 'no_task', status: 200 };

			const taskData = activeTasks.get(taskId);
			if (!taskData) return { task_status: 'not_found', status: 200 };

			return {
				task_status: taskData.status,
				progress: taskData.progress,
				message: taskData.message,
				error: taskData.error,
				status: 200
			};
		} catch (error) {
			return reply.code(500).send({ error: error.message });
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
