export default async function filmotecaRoutes(fastify, options) {
	const db = fastify.db;

	// Cache control headers
	fastify.addHook('onSend', (request, reply, payload, done) => {
		if (request.url.startsWith('/database')) {
			reply.header('Cache-Control', 'no-store');
			reply.header('Pragma', 'no-cache');
		}
		done(null, payload);
	});

	// Health check
	fastify.get('/health', async (request, reply) => {
		try {
			const dbStatus = db ? 'connected' : 'disconnected';
			const queriesCount = db ? Object.keys(db.tag_query).length : 0;
			let dbTest = false;
			if (db) {
				try {
					await db.execute('SELECT 1', {});
					dbTest = true;
				} catch (e) {
					fastify.log.error('Health check DB error:', e);
				}
			}
			return {
				status: 'OK',
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				database: {
					status: dbStatus,
					queries_loaded: queriesCount,
					working: dbTest
				}
			};
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Genre endpoints
	fastify.get('/get_all_genres', async (request, reply) => {
		try {
			const result = await db.execute('get_all_genres', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ message: error.message, status: 500 });
		}
	});

	fastify.get('/get_all_subgenres', async (request, reply) => {
		try {
			const result = await db.execute('get_all_subgenres', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/get_all_pathgenres', async (request, reply) => {
		try {
			const result = await db.execute('get_all_pathgenres', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Film attribute endpoints
	fastify.get('/select_quality', async (request, reply) => {
		try {
			const result = await db.execute('select_quality', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/select_extension', async (request, reply) => {
		try {
			const result = await db.execute('select_extension', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/select_resolution', async (request, reply) => {
		try {
			const result = await db.execute('select_resolution', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/select_fps', async (request, reply) => {
		try {
			const result = await db.execute('select_fps', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/select_country', async (request, reply) => {
		try {
			const result = await db.execute('select_country', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Years endpoint
	fastify.get('/years/available', async (request, reply) => {
		try {
			const result = await db.execute('get_years', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Movie list endpoints
	fastify.get('/last_movies', async (request, reply) => {
		try {
			const limit = parseInt(request.query.limit) || 50;
			const result = await db.execute('last_movies', { ':limit': limit });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ message: error.message, status: 500 });
		}
	});

	fastify.get('/movies_by_genre', async (request, reply) => {
		try {
			const id_genre = parseInt(request.query.id_genre);
			if (!id_genre) return reply.code(400).send({ message: 'id_genre required', status: 400 });
			const result = await db.execute('movies_by_genre', { ':id_genre': id_genre });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/search_movies', async (request, reply) => {
		try {
			const search = request.query.search || '';
			const year = parseInt(request.query.year) || 0;
			const limit = parseInt(request.query.limit) || 10;
			const result = await db.execute('search_movies', {
				':search': `%${search}%`,
				':year': year,
				':limit': limit
			});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Movie detail endpoints
	fastify.get('/get_movie', async (request, reply) => {
		try {
			const id_movie = parseInt(request.query.id_movie);
			if (!id_movie) return reply.code(400).send({ message: 'id_movie required', status: 400 });
			const result = await db.execute('get_movie', { ':id_movie': id_movie });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/extra_info_movie', async (request, reply) => {
		try {
			const id_movie = parseInt(request.query.id_movie);
			if (!id_movie) return reply.code(400).send({ message: 'id_movie required', status: 400 });
			const result = await db.execute('extra_info_movie', { ':id_movie': id_movie });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Movie modification endpoints
	fastify.put('/modify_movie', async (request, reply) => {
		try {
			const params = Object.fromEntries(
				Object.entries(request.body).map(([k, v]) => [`:${k}`, v])
			);
			const result = await db.execute('modify_movie', params);
			return { data: result, message: 'Movie updated successfully', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.delete('/delete_movie', async (request, reply) => {
		try {
			const result = await db.execute('delete_movie', { ':id_movie': request.body.id_movie });
			return { data: result, message: 'Movie deleted successfully', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Stats endpoints
	fastify.get('/stats/summary', async (request, reply) => {
		try {
			const result = await db.execute('stats_summary', {});
			const stats = result[0] || {};
			return {
				data: {
					total_movies: stats.total_movies || 0,
					total_size: stats.total_size || 0,
					total_duration: stats.total_duration || 0,
					total_genres: stats.total_genres || 0
				},
				status: 200
			};
		} catch (error) {
			return reply.code(500).send({ message: error.message, status: 500 });
		}
	});

	fastify.get('/genres/cloud', async (request, reply) => {
		try {
			const result = await db.execute('genres_cloud', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ message: error.message, status: 500 });
		}
	});

	// Future: Torrent task endpoints (placeholder for now)
	fastify.post('/start_torrent_task', async (request, reply) => {
		return { taskId: `torrent_${Date.now()}`, status: 200 };
	});

	fastify.get('/torrent_task_status', async (request, reply) => {
		const taskId = request.query.taskId;
		return { task_status: taskId ? 'not_found' : 'no_task', status: 200 };
	});

	fastify.post('/stop_torrent_task', async (request, reply) => {
		return { success: false, message: 'No active task', status: 200 };
	});
}
