import listRoutes from './lists.js';
import chartsRoutes from './charts.js';
import maintenanceRoutes from './maintenance.js';
import genreRoutes from './genres.js';
import filtersRoutes from './filters.js';
import torrentRoutes from './torrent.js';

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
					await db.execute('health_check', {});
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

	// Register all route modules
	await fastify.register(listRoutes);
	await fastify.register(chartsRoutes);
	await fastify.register(maintenanceRoutes);
	await fastify.register(genreRoutes);
	await fastify.register(filtersRoutes);
	await fastify.register(torrentRoutes);
}
