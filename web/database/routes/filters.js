export default async function filtersRoutes(fastify) {
	const db = fastify.db;

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
			const result = await db.execute('get_all_countries', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/years/available', async (request, reply) => {
		try {
			const result = await db.execute('get_years', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Advanced search
	fastify.get('/advanced_search', async (request, reply) => {
		try {
			const params = {
				':id_movie': parseInt(request.query.id_movie) || null,
				':quality': request.query.quality || null,
				':extension': request.query.extension || null,
				':resolution': request.query.resolution || null,
				':fps': request.query.fps || null,
				':id_country': parseInt(request.query.id_country) || null,
				':min_rating': parseFloat(request.query.min_rating) || 0,
				':max_rating': parseFloat(request.query.max_rating) || 10,
				':min_date': request.query.min_date || null,
				':max_date': request.query.max_date || null
			};
			const result = await db.execute('advanced', params);
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
