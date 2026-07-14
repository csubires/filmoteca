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

	// Generic execute task (delegates to Python adapter HTTP service)
	fastify.post('/execute_task', async (request, reply) => {
		try {
			const { task, config } = request.body || {};
			if (!task) return reply.code(400).send({ error: 'No task specified' });

			const adapterUrl = process.env.PYTHON_ADAPTER_URL || 'http://localhost:5000';
			fastify.log.info(`POST /execute_task - Delegating ${task} to adapter ${adapterUrl}`);

			const resp = await fetch(`${adapterUrl}/execute_task`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task, config: config || {} })
			});

			if (!resp.ok) {
				const errText = await resp.text();
				fastify.log.error('Adapter error: ' + errText);
				return reply.code(500).send({ error: 'Adapter failed to start task' });
			}

			const json = await resp.json();
			const taskId = json.taskId;

			const nowId = `${task}_${Date.now()}`;
			const taskData = {
				id: taskId,
				adapterId: taskId,
				status: 'running',
				progress: 0,
				message: `Delegated task ${task} to adapter`,
				startTime: Date.now(),
				shouldStop: false,
				output: ''
			};

			activeTasks.set(taskId, taskData);

			return { taskId, status: 200 };
		} catch (error) {
			fastify.log.error('Error executing task (proxy):', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// Generic task status (proxy to adapter when task exists)
	fastify.get('/task_status', async (request, reply) => {
		try {
			fastify.log.info(`/task_status query: ${JSON.stringify(request.query)}`);
			const taskId = request.query.taskId;
			if (!taskId) return { data: { task_status: 'no_task' }, status: 200 };

			const adapterUrl = process.env.PYTHON_ADAPTER_URL || 'http://localhost:5000';

			// If we know the task locally, ask adapter for latest status
			try {
				const resp = await fetch(`${adapterUrl}/task_status?taskId=${encodeURIComponent(taskId)}`);
				if (resp.ok) {
					const json = await resp.json();
					return { data: json.data, status: 200 };
				}
			} catch (e) {
				fastify.log.error('Error contacting adapter for status', e);
			}

			// Fallback to local info if adapter not reachable
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

	// Generic stop task (forward to adapter when possible)
	fastify.post('/stop_task', async (request, reply) => {
		try {
			const taskId = request.body?.taskId;
			if (!taskId) return { success: false, message: 'No taskId provided', status: 200 };

			const adapterUrl = process.env.PYTHON_ADAPTER_URL || 'http://localhost:5000';
			try {
				const resp = await fetch(`${adapterUrl}/stop_task`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ taskId })
				});
				if (resp.ok) {
					return { success: true, message: 'Task stop requested', status: 200 };
				}
			} catch (e) {
				fastify.log.error('Error contacting adapter to stop task', e);
			}

			// Fallback: mark locally
			const taskData = activeTasks.get(taskId);
			if (!taskData) return { success: false, message: 'Task not found', status: 200 };

			taskData.shouldStop = true;
			taskData.status = 'stopping';

			return { success: true, message: 'Task stopped (local)', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// ===== ENDPOINTS PARA GESTIONAR TABLA DATA =====

	// Obtener datos de configuración (tabla data)
	fastify.get('/get_data', async (request, reply) => {
		try {
			fastify.log.info('GET /get_data - Obtaining data table configuration');
			const result = await db.execute('select_urlend', {});
			fastify.log.info(`select_urlend raw result: ${JSON.stringify(result)}`);

			if (!result || result.length === 0) {
				fastify.log.info('No data found, initializing with defaults');
				return {
					data: {
						id_data: 0,
						url_end: null,
						date_end: null,
						npseries: 1
					},
					status: 200
				};
			}

			// result[0] may be an object with keys or an array; support both
			let url_end = null, date_end = null, npseries = 1;
			const row = result[0];
			if (Array.isArray(row)) {
				[url_end, date_end, npseries] = row;
			} else if (row && typeof row === 'object') {
				url_end = row.url_end ?? null;
				date_end = row.date_end ?? null;
				npseries = row.npseries ?? 1;
			}

			return {
				data: {
					id_data: 0,
					url_end,
					date_end,
					npseries
				},
				status: 200
			};
		} catch (error) {
			fastify.log.error('Error in /get_data:', error.message || error);
			fastify.log.error('Error stack:', error.stack);
			fastify.log.error('Available queries:', Object.keys(db.queries || {}));
			return reply.code(500).send({ error: error.message || String(error) });
		}
	});

	// Actualizar datos de configuración (tabla data)
	fastify.put('/update_data', async (request, reply) => {
		try {
			const { url_end, date_end, npseries } = request.body || {};

			fastify.log.info(`PUT /update_data - Updating: url_end=${url_end}, date_end=${date_end}, npseries=${npseries}`);

			// Validar que al menos haya un campo
			if (url_end === undefined && date_end === undefined && npseries === undefined) {
				return reply.code(400).send({ error: 'At least one field must be provided' });
			}

			// Obtener valores actuales para mantener los que no se actualizan
			const current = await db.execute('select_urlend', {});
			const currentRow = current && current.length > 0 ? current[0] : null;
			const currentData = currentRow
				? {
					url_end: Array.isArray(currentRow) ? currentRow[0] : currentRow.url_end,
					date_end: Array.isArray(currentRow) ? currentRow[1] : currentRow.date_end,
					npseries: Array.isArray(currentRow) ? currentRow[2] : currentRow.npseries
				}
				: { url_end: null, date_end: null, npseries: 1 };

			// Preparar datos actualizados
			const updateData = {
				url_end: url_end !== undefined ? url_end : currentData.url_end,
				date_end: date_end !== undefined ? date_end : currentData.date_end,
				npseries: npseries !== undefined ? npseries : currentData.npseries
			};

			await db.execute('update_urlend', updateData);

			fastify.log.info('Data updated successfully');
			return {
				data: {
					id_data: 0,
					...updateData
				},
				status: 200,
				message: 'Configuration updated successfully'
			};
		} catch (error) {
			fastify.log.error('Error in /update_data:', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// Reinicializar tabla data a valores por defecto
	fastify.post('/reset_data', async (request, reply) => {
		try {
			fastify.log.info('POST /reset_data - Resetting data table to defaults');

			await db.execute('update_urlend', {
				url_end: null,
				date_end: null,
				npseries: 1
			});

			fastify.log.info('Data table reset to defaults');
			return {
				data: {
					id_data: 0,
					url_end: null,
					date_end: null,
					npseries: 1
				},
				status: 200,
				message: 'Configuration reset to defaults'
			};
		} catch (error) {
			fastify.log.error('Error in /reset_data:', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// ===== ENDPOINTS PARA GESTIONAR CACHÉ =====

	// Obtener estadísticas del caché
	fastify.get('/cache_stats', async (request, reply) => {
		try {
			fastify.log.info('GET /cache_stats - Getting cache statistics');

			// Obtener total de registros en caché
			const allCache = await db.execute('select_torrent_cache_by_date', { ':date_cached': '%' }).catch(() => []);

			// Obtener caché de hoy
			const today = getTodayDate();
			const todayCache = await db.execute('select_torrent_cache_by_date', { ':date_cached': today });

			let todayMovies = 0;
			let todaySeries = 0;

			if (todayCache && todayCache.length > 0) {
				try {
					todayMovies = JSON.parse(todayCache[0][2] || '[]').length;
					todaySeries = JSON.parse(todayCache[0][3] || '[]').length;
				} catch (e) {
					fastify.log.warn('Error parsing today cache:', e);
				}
			}

			return {
				data: {
					today_date: today,
					today_movies: todayMovies,
					today_series: todaySeries,
					today_cached: !!todayCache || todayCache?.length > 0
				},
				status: 200
			};
		} catch (error) {
			fastify.log.error('Error in /cache_stats:', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// Limpiar caché antiguo (más de N días)
	fastify.post('/clear_old_cache', async (request, reply) => {
		try {
			const { days = 7 } = request.body || {};
			fastify.log.info(`POST /clear_old_cache - Clearing cache older than ${days} days`);

			// Calcular fecha límite
			const limitDate = new Date();
			limitDate.setDate(limitDate.getDate() - days);
			const limitDateStr = limitDate.getFullYear().toString() +
								   String(limitDate.getMonth() + 1).padStart(2, '0') +
								   String(limitDate.getDate()).padStart(2, '0');

			// Aquí necesitarías una query DELETE para borrar registros antiguos
			// Por ahora solo informamos
			fastify.log.info(`Would delete cache before ${limitDateStr}`);

			return {
				data: {
					message: `Cache older than ${days} days would be cleared`,
					limit_date: limitDateStr
				},
				status: 200
			};
		} catch (error) {
			fastify.log.error('Error in /clear_old_cache:', error);
			return reply.code(500).send({ error: error.message });
		}
	});

	// Resetear caché actual (por fecha)
	fastify.post('/reset_cache', async (request, reply) => {
		try {
			const { date_cached = getTodayDate() } = request.body || {};
			fastify.log.info(`POST /reset_cache - Resetting cache for ${date_cached}`);

			// Aquí necesitarías una query DELETE para borrar el caché de la fecha
			// Por ahora solo informamos
			fastify.log.info(`Would reset cache for ${date_cached}`);

			return {
				data: {
					message: `Cache for ${date_cached} would be reset`,
					date_cached
				},
				status: 200
			};
		} catch (error) {
			fastify.log.error('Error in /reset_cache:', error);
			return reply.code(500).send({ error: error.message });
		}
	});
}
