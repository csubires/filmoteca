export default async function listRoutes(fastify) {
	const db = fastify.db;

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

			// Paginación
			const limit = Math.min(parseInt(request.query.limit) || (process.env.MOVIES_PER_PAGE || 20), parseInt(process.env.MAX_MOVIES_PER_PAGE || 100));
			const offset = parseInt(request.query.offset) || 0;

			// Obtener total de películas para esta página
			const countResult = await db.execute('movies_by_genre_count', { ':id_genre': id_genre });
			const total = countResult?.[0]?.total || 0;

			// Obtener películas paginadas
			const result = await db.execute('movies_by_genre', {
				':id_genre': id_genre,
				':limit': limit,
				':offset': offset
			});

			return {
				data: result,
				pagination: {
					offset,
					limit,
					total,
					page: Math.floor(offset / limit) + 1,
					pages: Math.ceil(total / limit)
				},
				status: 200
			};
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

	fastify.get('/recommended', async (request, reply) => {
		try {
			const result = await db.execute('recommended', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

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

	fastify.get('/update_inet_movie', async (request, reply) => {
		try {
			const id_movie = parseInt(request.query.id_movie);
			if (!id_movie) return reply.code(400).send({ message: 'id_movie required', status: 400 });
			const result = await db.execute('update_inet_movie', { ':id_movie': id_movie });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/downloads/rating/:year', async (request, reply) => {
		try {
			const year = parseInt(request.params.year);
			if (!year) return reply.code(400).send({ message: 'year required', status: 400 });
			const result = await db.execute('get_rating', { ':year': year });
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
