const Fastify = require('fastify');
const path = require('path');
require('dotenv').config();

async function buildApp(options = {}) {
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                    colorize: true
                }
            }
        },
        ...options
    });

    try {
        await fastify.register(require('@fastify/cors'), {
            origin: true,
            credentials: true
        });

        await fastify.register(require('@fastify/formbody'));

        fastify.log.info('Registrando plugin de base de datos...');
        await fastify.register(require('./plugins/database'), {
            dbPath: process.env.DB_PATH || path.join(__dirname, '../../app/data/movieDB.db'),
            queriesJsonPath: path.join(__dirname, './database/queries.json')
        });

        fastify.log.info('Registrando archivos estáticos...');
        await fastify.register(require('./static'));

        fastify.log.info('Registrando rutas API...');
        await fastify.register(require('./routes/api.routes'), { prefix: '/api' });

        fastify.get('/health', async (request, reply) => {
            const dbStatus = fastify.db ? 'connected' : 'disconnected';
            const queriesCount = fastify.db ? Object.keys(fastify.db.tag_query).length : 0;
            let dbTest = false;
            if (fastify.db) {
                try {
                    const test = await fastify.db.execute('SELECT 1', {});
                    dbTest = !!test;
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
        });


        fastify.log.info('Aplicación inicializada correctamente');
    } catch (error) {
        fastify.log.error('Error durante la inicialización:', error);
        throw error;
    }

    return fastify;
}

if (require.main === module) {
    const start = async () => {
        try {
            const app = await buildApp();
            const port = process.env.PORT || 3000;
            const host = process.env.HOST || '0.0.0.0';
            await app.listen({ port, host });
            console.log('\n' + '='.repeat(50));
            console.log(`Servidor Node.js (Fastify) listo!`);
            console.log(`API: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
            console.log(`Health: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`);
            console.log('='.repeat(50) + '\n');
        } catch (err) {
            console.error('Error fatal:', err);
            process.exit(1);
        }
    };
    start();
}

module.exports = buildApp;
