import createFastifyApp from './fastify-config.js';
import filmotecaRoutes from './routes/filmoteca.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHandlerSQL } from './connection.js';
import { loadQueries } from './queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDatabaseService() {
	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		corsOrigin: true
	});

	// Load SQLite database for Filmoteca
	const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/movieDB.db');
	const queriesJsonPath = process.env.QUERIES_PATH || path.join(__dirname, './queries.json');

	fastify.log.info(`📦 Loading database from: ${dbPath}`);
	fastify.log.info(`📖 Loading queries from: ${queriesJsonPath}`);

	const tagQuery = loadQueries(queriesJsonPath);
	if (Object.keys(tagQuery).length === 0) {
		fastify.log.warn('⚠️ No queries loaded. Check queries.json');
	} else {
		fastify.log.info(`✅ Loaded ${Object.keys(tagQuery).length} queries`);
	}

	try {
		const db = createHandlerSQL(dbPath, tagQuery);
		await db.connect();
		const testResult = await db.execute('SELECT 1', {});
		fastify.log.info('✅ Database connection successful');
		fastify.decorate('db', db);

		fastify.addHook('onClose', async (instance) => {
			fastify.log.info('🔄 Closing database connection...');
			await instance.db.close();
			fastify.log.info('✅ Connection closed');
		});
	} catch (error) {
		fastify.log.error('❌ Database connection error:', error);
		throw error;
	}

	await fastify.register(filmotecaRoutes, { prefix: '/database' });

	await fastify.listen({ host: '0.0.0.0', port: 3003 });
	console.log('\n' + '='.repeat(50));
	console.log('Database Service (Filmoteca) ready!');
	console.log('Database: sqlite://../../data/movieDB.db');
	console.log('Health: http://0.0.0.0:3003/database/health');
	console.log('='.repeat(50) + '\n');
}

startDatabaseService().catch(error => {
	console.error(error);
	process.exit(1);
});
