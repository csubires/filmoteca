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
			const q = request.query || {};
			const where = ['M.deleted = 0'];
			const params = {};

			const idMovie = parseInt(q.id_movie, 10);
			if (Number.isInteger(idMovie) && idMovie > 0) {
				where.push('M.id_movie = :id_movie');
				params[':id_movie'] = idMovie;
			}

			if (q.quality) {
				where.push('M.quality = :quality');
				params[':quality'] = q.quality;
			}

			if (q.extension) {
				where.push('M.extension = :extension');
				params[':extension'] = q.extension;
			}

			if (q.resolution) {
				where.push('M.resolution = :resolution');
				params[':resolution'] = q.resolution;
			}

			if (q.fps) {
				where.push('M.fps = :fps');
				params[':fps'] = q.fps;
			}

			const idCountry = parseInt(q.id_country, 10);
			if (Number.isInteger(idCountry) && idCountry > 0) {
				where.push('M.id_country = :id_country');
				params[':id_country'] = idCountry;
			}

			const minRating = q.min_rating !== undefined && q.min_rating !== '' ? parseFloat(q.min_rating) : null;
			const maxRating = q.max_rating !== undefined && q.max_rating !== '' ? parseFloat(q.max_rating) : null;
			if (Number.isFinite(minRating)) {
				where.push('M.ratings >= :min_rating');
				params[':min_rating'] = minRating;
			}
			if (Number.isFinite(maxRating)) {
				where.push('M.ratings <= :max_rating');
				params[':max_rating'] = maxRating;
			}

			if (q.min_date) {
				where.push('M.file_created >= :min_date');
				params[':min_date'] = q.min_date;
			}
			if (q.max_date) {
				where.push('M.file_created <= :max_date');
				params[':max_date'] = q.max_date;
			}

			const sql = `
				SELECT
					M.id_movie,
					M.title,
					M.year,
					M.duration_str,
					M.ratings,
					M.urlpicture,
					M.id_genre AS idgen,
					genre.name AS genre_name
				FROM movies AS M
				INNER JOIN genre ON genre.id_genre = M.id_genre
				${where.length ? `WHERE ${where.join(' AND ')}` : ''}
				ORDER BY M.id_movie DESC
				LIMIT 50
			`;

			console.log('\n[DB] Query: advanced_search_dynamic');
			console.log('[DB] SQL:', sql.replace(/\s+/g, ' ').trim());
			console.log('[DB] Params:', params);

			const result = await new Promise((resolve, reject) => {
				db.db.all(sql, params, (err, rows) => {
					if (err) return reject(err);
					resolve(rows || []);
				});
			});

			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
