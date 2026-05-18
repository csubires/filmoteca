export default async function genreRoutes(fastify) {
	const db = fastify.db;

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

	fastify.get('/get_genre_info', async (request, reply) => {
		try {
			const result = await db.execute('get_info_genre', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/get_genre_name/:id_genre', async (request, reply) => {
		try {
			const id_genre = parseInt(request.params.id_genre);
			const result = await db.execute('get_name_genre', { ':id_genre': id_genre });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
