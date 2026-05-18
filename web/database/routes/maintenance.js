export default async function maintenanceRoutes(fastify) {
	const db = fastify.db;

	// Maintenance check endpoints
	fastify.get('/maintenance/repeated', async (request, reply) => {
		try {
			const result = await db.execute('repeated_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/missing-hdd0', async (request, reply) => {
		try {
			const result = await db.execute('missing_movies_hdd0', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/missing-hdd1', async (request, reply) => {
		try {
			const result = await db.execute('missing_movies_hdd1', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/incomplete', async (request, reply) => {
		try {
			const result = await db.execute('incomplete_movie_info', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/censored', async (request, reply) => {
		try {
			const result = await db.execute('censured_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/low-rated', async (request, reply) => {
		try {
			const result = await db.execute('devalued_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/bad-movies', async (request, reply) => {
		try {
			const result = await db.execute('shit_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/corrupt', async (request, reply) => {
		try {
			const result = await db.execute('corrupt_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/overevaluated', async (request, reply) => {
		try {
			const result = await db.execute('overevalued_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/incomplete-genres', async (request, reply) => {
		try {
			const result = await db.execute('incomplete_genre', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/maintenance/uncoded-countries', async (request, reply) => {
		try {
			const result = await db.execute('uncoded_country', {});
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

	// Report management
	fastify.delete('/delete_report', async (request, reply) => {
		try {
			const result = await db.execute('delete_report', { ':id_report': request.body.id_report });
			return { data: result, message: 'Report deleted successfully', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
