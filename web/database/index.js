import createFastifyApp from './fastify-config.js';
import filmotecaRoutes from './routes/filmoteca.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHandlerSQL } from './connection.js';
import { loadQueries } from './queries/queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDatabaseService() {
	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		corsOrigin: true
	});

	// Load SQLite database for Filmoteca
	const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/filmoteca.db');
	const queriesDirPath = process.env.QUERIES_PATH || path.join(__dirname, './queries');

	fastify.log.info(`📦 Loading database from: ${dbPath}`);
	fastify.log.info(`📖 Loading queries from: ${queriesDirPath}`);

	const tagQuery = loadQueries(queriesDirPath);
	if (Object.keys(tagQuery).length === 0) {
		fastify.log.warn('⚠️ No queries loaded. Check queries directory');
	} else {
		fastify.log.info(`✅ Loaded ${Object.keys(tagQuery).length} queries`);
	}

	try {
		const db = createHandlerSQL(dbPath, tagQuery);
		await db.connect();
		const testResult = await db.execute('health_check', {});
		fastify.log.info('✅ Database connection successful');

		// Initialize torrent data if not exists
		try {
			const dataResult = await db.execute('select_urlend', {});
			if (!dataResult || dataResult.length === 0) {
				fastify.log.info('Initializing torrent data table...');
				await new Promise((resolve, reject) => {
					db.db.run(
						"INSERT OR IGNORE INTO data (id_data, url_end, date_end, npseries) VALUES (0, NULL, NULL, 1)",
						(err) => {
							if (err) {
								fastify.log.warn('Warning initializing torrent data:', err.message);
								resolve(); // Don't reject on init failure
							} else {
								fastify.log.info('✅ Torrent data initialized');
								resolve();
							}
						}
					);
				});
			}
		} catch (e) {
			fastify.log.warn('Could not initialize torrent data:', e.message);
		}

		// Ensure torrent_cache table exists
		try {
			await new Promise((resolve, reject) => {
				db.db.run(`CREATE TABLE IF NOT EXISTS torrent_cache (
					id_torrent_cache INTEGER PRIMARY KEY AUTOINCREMENT,
					date_cached TEXT NOT NULL UNIQUE,
					movies_json TEXT,
					series_json TEXT,
					url_end TEXT,
					npseries INTEGER DEFAULT 1,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)` , (err) => {
					if (err) {
						fastify.log.warn('Could not create torrent_cache table:', err.message);
						return resolve();
					}
					fastify.log.info('✅ torrent_cache table ensured');
					resolve();
				});
			});
		} catch (e) {
			fastify.log.warn('Error ensuring torrent_cache table:', e.message);
		}

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
	console.log('Database: sqlite://../../data/filmoteca.db');
	console.log('Health: http://0.0.0.0:3003/database/health');
	console.log('='.repeat(50) + '\n');
}

startDatabaseService().catch(error => {
	console.error(error);
	process.exit(1);
});
