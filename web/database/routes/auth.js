export default async function internalAuthRoutes(fastify) {
	const db = fastify.db;

	fastify.get('/internal/auth/user', async (request, reply) => {
		try {
			const email = String(request.query.email || '').trim();
			if (!email) {
				return reply.code(400).send({ message: 'email required', status: 400 });
			}

			const result = await db.execute('auth_get_user', { ':email': email });
			return { data: result[0] || null, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.get('/internal/auth/user/exists', async (request, reply) => {
		try {
			const email = String(request.query.email || '').trim();
			const name = String(request.query.name || '').trim();
			if (!email || !name) {
				return reply.code(400).send({ message: 'email and name required', status: 400 });
			}

			const result = await db.execute('auth_user_exists', {
				':email': email,
				':name': name
			});

			return { data: { exists: result.length > 0 }, status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.post('/internal/auth/user', async (request, reply) => {
		try {
			const payload = {
				':name': String(request.body.name || '').trim(),
				':email': String(request.body.email || '').trim(),
				':password': String(request.body.password || ''),
				':ip': request.body.ip || null,
				':agent': request.body.agent || null,
				':created_at': request.body.created_at || new Date().toISOString(),
				':last_login': request.body.last_login || new Date().toISOString(),
				':role': request.body.role || 'user'
			};

			const result = await db.execute('auth_create_user', payload);
			return { data: result, message: 'User created successfully', status: 201 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});

	fastify.patch('/internal/auth/user/last-login', async (request, reply) => {
		try {
			const idUser = parseInt(request.body.id_user, 10);
			const lastLogin = String(request.body.last_login || '').trim();
			if (!Number.isInteger(idUser) || idUser <= 0 || !lastLogin) {
				return reply.code(400).send({ message: 'id_user and last_login required', status: 400 });
			}

			const result = await db.execute('auth_update_last_login', {
				':id_user': idUser,
				':last_login': lastLogin
			});
			return { data: result, message: 'Last login updated successfully', status: 200 };
		} catch (error) {
			return reply.code(500).send({ error: error.message });
		}
	});
}
