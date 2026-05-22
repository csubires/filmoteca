const AUTH_VERIFY_URL = `${process.env.AUTH_URL || 'http://localhost:3001'}/auth/verify`;

function sanitizeText(value, { max = 255, lower = false } = {}) {
	if (value === null || value === undefined) {
		return null;
	}
	const sanitized = String(value)
		.replace(/[\u0000-\u001F\u007F]/g, '')
		.trim();
	if (!sanitized) {
		return null;
	}
	const truncated = sanitized.slice(0, max);
	return lower ? truncated.toLowerCase() : truncated;
}

function sanitizeInteger(value, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, nullable = true } = {}) {
	if (value === null || value === undefined || value === '') {
		if (nullable) return null;
		throw new Error('integer value is required');
	}
	const parsed = Number.parseInt(String(value), 10);
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
		throw new Error('invalid integer value');
	}
	return parsed;
}

function sanitizeNumber(value, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, nullable = true } = {}) {
	if (value === null || value === undefined || value === '') {
		if (nullable) return null;
		throw new Error('numeric value is required');
	}
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
		throw new Error('invalid numeric value');
	}
	return parsed;
}

function sanitizeBoolean(value) {
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (typeof value === 'number') return value === 1 ? 1 : 0;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['1', 'true', 'on', 'yes'].includes(normalized)) return 1;
		if (['0', 'false', 'off', 'no', ''].includes(normalized)) return 0;
	}
	return 0;
}

const MOVIE_PATCH_FIELDS = {
	title: { column: 'title', parse: (v) => sanitizeText(v, { max: 220 }) },
	realtitle: { column: 'realtitle', parse: (v) => sanitizeText(v, { max: 220 }) },
	year: { column: 'year', parse: (v) => sanitizeInteger(v, { min: 1800, max: 2900 }) },
	quality: { column: 'quality', parse: (v) => sanitizeText(v, { max: 24 }) },
	extension: { column: 'extension', parse: (v) => sanitizeText(v, { max: 12, lower: true }) },
	size: { column: 'size', parse: (v) => sanitizeInteger(v, { min: 0, max: 2_000_000_000_000 }) },
	duration: { column: 'duration', parse: (v) => sanitizeInteger(v, { min: 0, max: 172800 }) },
	fps: { column: 'fps', parse: (v) => sanitizeNumber(v, { min: 1, max: 240 }) },
	resolution: { column: 'resolution', parse: (v) => sanitizeText(v, { max: 32 }) },
	hdd_code: { column: 'hdd_code', parse: (v) => sanitizeInteger(v, { min: 0, max: 99, nullable: false }) },
	ratings: { column: 'ratings', parse: (v) => sanitizeNumber(v, { min: 0, max: 10 }) },
	pathfile: { column: 'pathfile', parse: (v) => sanitizeText(v, { max: 1024 }) },
	censure: { column: 'censure', parse: (v) => sanitizeBoolean(v) },
	id_country: { column: 'id_country', parse: (v) => sanitizeInteger(v, { min: 1, max: 99999 }) },
	urldesc: { column: 'urldesc', parse: (v) => sanitizeText(v, { max: 1024 }) },
	urlpicture: { column: 'urlpicture', parse: (v) => sanitizeText(v, { max: 1024 }) },
	id_genre: { column: 'id_genre', parse: (v) => sanitizeInteger(v, { min: 1, max: 99999, nullable: false }) },
	id_subgenre: { column: 'id_subgenre', parse: (v) => sanitizeInteger(v, { min: 1, max: 99999 }) }
};

async function verifyAuthUser(request) {
	const headers = {
		'Content-Type': 'application/json'
	};
	if (request.headers.authorization) {
		headers.Authorization = request.headers.authorization;
	}
	if (request.headers.cookie) {
		headers.Cookie = request.headers.cookie;
	}

	const response = await fetch(AUTH_VERIFY_URL, {
		method: 'POST',
		headers,
		body: JSON.stringify({})
	});

	if (!response.ok) {
		console.error(`[AUTH VERIFY] Failed: ${response.status}`, { url: AUTH_VERIFY_URL, hasAuthHeader: !!headers.Authorization, hasCookie: !!headers.Cookie });
		return null;
	}

	const data = await response.json();
	console.log('[AUTH VERIFY] Success:', { valid: data?.valid, role: data?.user?.role });
	if (!data?.valid || !data?.user) {
		console.error('[AUTH VERIFY] Invalid response:', data);
		return null;
	}

	return data.user;
}

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

	fastify.get('/maintenance/deleted-movies', async (request, reply) => {
		try {
			const result = await db.execute('deleted_movies', {});
			return { data: result, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.put('/restore_movie', async (request, reply) => {
		try {
			const result = await db.execute('restore_movie', { ':id_movie': request.body.id_movie });
			return { data: result, message: 'Movie restored successfully', status: 200 };
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

	fastify.put('/update_country', async (request, reply) => {
		try {
			const idCountry = request.body.id_country ?? request.body.idCountry;
			const code = String(request.body.code ?? '').trim();
			const flag = String(request.body.flag ?? '').trim();
			const result = await db.execute('set_code_country', {
				':id_country': idCountry,
				':code': code,
				':flag': flag
			});
			return { data: result, message: 'Country updated successfully', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	// Movie modification endpoints
	fastify.patch('/modify_movie/:id_movie', async (request, reply) => {
		try {
			const user = await verifyAuthUser(request);
			if (!user) {
				return reply.code(401).send({ error: 'Authentication required', code: 'UNAUTHORIZED' });
			}

			// Allow any authenticated user to modify movies
			// (if you want to restrict to admin only, restore the role check)

			const idMovie = sanitizeInteger(request.params.id_movie, { min: 1, nullable: false });
			const payload = request.body && typeof request.body === 'object' ? request.body : {};

			const incomingKeys = Object.keys(payload);
			if (incomingKeys.length === 0) {
				return reply.code(400).send({ error: 'No fields provided', code: 'EMPTY_PATCH' });
			}

			const invalidFields = incomingKeys.filter((key) => !Object.prototype.hasOwnProperty.call(MOVIE_PATCH_FIELDS, key));
			if (invalidFields.length > 0) {
				return reply.code(400).send({
					error: `Invalid fields: ${invalidFields.join(', ')}`,
					code: 'INVALID_FIELDS'
				});
			}

			const existingRows = await db.execute('get_movie', { ':id_movie': idMovie });
			if (!existingRows?.length) {
				return reply.code(404).send({ error: 'Movie not found', code: 'NOT_FOUND' });
			}

			const updates = [];
			const values = [];

			for (const [key, rawValue] of Object.entries(payload)) {
				const fieldConfig = MOVIE_PATCH_FIELDS[key];
				let parsedValue;
				try {
					parsedValue = fieldConfig.parse(rawValue);
				} catch (validationError) {
					return reply.code(400).send({
						error: `Invalid value for ${key}`,
						code: 'INVALID_TYPE'
					});
				}

				updates.push(`${fieldConfig.column} = ?`);
				values.push(parsedValue);
			}

			if (updates.length === 0) {
				return reply.code(400).send({ error: 'No valid fields to update', code: 'EMPTY_PATCH' });
			}

			values.push(idMovie);
			const sql = `UPDATE movies SET ${updates.join(', ')} WHERE id_movie = ? AND deleted = 0`;
			const result = await db.executeRaw(sql, values);

			if (!result?.changes) {
				return reply.code(404).send({ error: 'Movie not found or not updated', code: 'NOT_UPDATED' });
			}

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

	fastify.delete('/delete_genre', async (request, reply) => {
		try {
			const result = await db.execute('delete_genre', { ':id_genre': request.body.id_genre });
			return { data: result, message: 'Genre deleted successfully', status: 200 };
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
