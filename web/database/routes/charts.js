export default async function chartsRoutes(fastify) {
	const db = fastify.db;

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

	fastify.get('/report/summary', async (request, reply) => {
		try {
			const result = await db.execute('get_all_report', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/hdd/:hdd_code', async (request, reply) => {
		try {
			const hdd_code = parseInt(request.params.hdd_code);
			const result = await db.execute('report_bd_01', { ':hdd_code': hdd_code });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/genres', async (request, reply) => {
		try {
			const result = await db.execute('report_bd_02', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/years', async (request, reply) => {
		try {
			const result = await db.execute('report_bd_03', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/countries', async (request, reply) => {
		try {
			const result = await db.execute('report_bd_04', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/ratings/:hdd_code', async (request, reply) => {
		try {
			const hdd_code = parseInt(request.params.hdd_code);
			const result = await db.execute('report_bd_05', { ':hdd_code': hdd_code });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/extensions', async (request, reply) => {
		try {
			const result = await db.execute('report_bd_06', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/world-map', async (request, reply) => {
		try {
			const result = await db.execute('world_map', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/report/hdd-distribution', async (request, reply) => {
		try {
			const result = await db.execute('report_bd_07', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
